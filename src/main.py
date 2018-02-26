import logging

from flask import Flask, redirect, request, jsonify
from im_futuretest import register_test 
from im_task_flask import setuptasksforflask
from im_futuretest_flask import register_futuretest_handlers, _create_route
from im_task import PermanentTaskFailure, task
from im_future import GetFutureAndCheckReady, FutureReadyForResult, future,\
    GenerateOnAllChildSuccess
import time
app = Flask(__name__)

from google.appengine.ext import ndb

register_futuretest_handlers(app)
setuptasksforflask(app)

@app.route("/", methods=["GET"])
def root():
    print "Here!" 
    return redirect(_create_route("ui/"), 301)

@app.route(_create_route("future"), methods=["GET"])
def future_api():
    lfutureKeyUrlSafe = request.args.get('futurekey')
    lincludeChildren = request.args.get('include_children')

    logging.info("lfutureKeyUrlSafe=%s" % lfutureKeyUrlSafe)
    logging.info("lincludeChildren=%s" % lincludeChildren)
    
    lfutureKey = ndb.Key(urlsafe = lfutureKeyUrlSafe)
    
    lfuture = lfutureKey.get()
    
    def keymap(future, level):
        return future.key.urlsafe()
            
    lfutureJson = lfuture.to_dict(maxlevel=2 if lincludeChildren else 1, futuremapf = keymap) if lfuture else None
    
    if lfutureJson:
        lfutureJson["futurekey"] = lfutureJson["key"]
        del lfutureJson["key"]

        lchildren = lfutureJson.get("zchildren") or [];
        for lchild in lchildren:
            lchild["futurekey"] = lchild["key"]
            del lchild["key"]
        
    return jsonify(lfutureJson)

@app.errorhandler(500)
def server_error(e):
    # Log the error and stacktrace.
    logging.exception('An error occurred during a request.')
    return 'An internal error occurred.', 500


@register_test
def firsttest(futurekey):
    pass

@register_test(tags=["fails"])
def secondtest(futurekey):
    raise PermanentTaskFailure("This test fails")


@register_test(description="This is a slow test...", tags=["fails"])
def slowtest(futurekey):
    time.sleep(20)
    return True

@register_test(description="Kicks off a task, which fires later and marks success", tags=["task"])
def slowtestusingtask(futurekey):
    @task(countdown=20)
    def SetResult():
        fut = GetFutureAndCheckReady(futurekey)
        fut.set_success(True)
        
    SetResult()
    raise FutureReadyForResult("waiting")

@register_test(description="slow with progress", tags=["task"])
def progresstest(futurekey):
    @task(countdown=1)
    def Tick(aProgress):
        fut = GetFutureAndCheckReady(futurekey)
        fut.set_localprogress(aProgress * 5)
        if aProgress < 20:
            Tick(aProgress+1)
        else:
            fut.set_success(aProgress)
        
    Tick(0)
    raise FutureReadyForResult("waiting")

@register_test(description="chain of futures", tags=["future"])
def chaintest(testfuturekey):
    def dostep(futurekey, count):
        if count < 10:
            lonAllChildSuccess = GenerateOnAllChildSuccess(futurekey, 0, lambda x, y: x + y)
            future(dostep, parentkey=futurekey, onallchildsuccessf=lonAllChildSuccess, countdown=1)(count+1)
            raise FutureReadyForResult("waiting")
        else:
            return count

    lonAllChildSuccess = GenerateOnAllChildSuccess(testfuturekey, 0, lambda x, y: x + y)
    future(dostep, parentkey=testfuturekey, onallchildsuccessf=lonAllChildSuccess, countdown=1)(0)
    raise FutureReadyForResult("waiting")