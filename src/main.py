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

@register_test(description="slow with progress", tags=["task"], weight = 20)#x
def progresstest(futurekey):
    @task(countdown=1)
    def Tick(aProgress):
        fut = GetFutureAndCheckReady(futurekey)
        fut.set_localprogress(aProgress)
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
            lonAllChildSuccess = GenerateOnAllChildSuccess(futurekey, None, lambda x, y: x or y)
            future(dostep, parentkey=futurekey, onallchildsuccessf=lonAllChildSuccess, countdown=1)(count+1)
            raise FutureReadyForResult("waiting")
        else:
            return {"count": count, "more": "stuff"}

    lonAllChildSuccess = GenerateOnAllChildSuccess(testfuturekey, None, lambda x, y: x or y)
    future(dostep, parentkey=testfuturekey, onallchildsuccessf=lonAllChildSuccess, countdown=1)(0)
    raise FutureReadyForResult("waiting")