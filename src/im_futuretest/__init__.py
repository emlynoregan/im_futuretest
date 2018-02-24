import functools
from model import TestRun
import logging
from google.appengine.ext import ndb
import os

_tests = {}
        
def _cleantest(test):
    logging.info(test)
    retval = dict(test) if test else None
    if retval:
        if "f" in retval:
            del retval["f"]
        if "taskkwargs" in retval:
            del retval["taskkwargs"]
    return retval

def _to_json(testrun):
    return testrun.to_json() if testrun else None
    

def register_test(f=None, name=None, description=None, tags=[], **taskkwargs):
    if not f:
        return functools.partial(register_test, name=name, description=description, tags=tags, **taskkwargs)

    global _tests

    lname = name if name else "%s.%s" % (f.__module__, f.__name__)
    
    if not isinstance(lname, basestring):
        raise Exception("name must be a string")
        
    _tests[lname] = {
        "f": f,
        "name": lname,
        "description": description,
        "tags": tags,
        "taskkwargs": taskkwargs
    }
    
    logging.info(_tests)
    
    return f

def run_test(testname):
    global _tests

    ltestDef = _tests.get(testname)
    
    if not ltestDef:
        raise Exception("Test named '%s' not found" % testname)
    
    return TestRun.go(ltestDef)

def get_test_by_name(name):
    global _tests
    
    logging.info("name: %s" % name)
    retval = _cleantest(_tests.get(name))
    
    return retval

def get_tests(tags = None):
    global _tests

    def tagmatch(testtags):
        return testtags and set(testtags).intersection(set(tags))    

    retval = sorted([
        _cleantest(ltest) 
        for ltest in _tests.values()
        if not tags or tagmatch(ltest.get("tags"))
    ], key=lambda test: test.get("name"))
    
    return retval
        
def get_testrun_by_id(testid):
    return TestRun.construct_key_for_id(testid).get() if testid else None

def get_json_testrun_by_id(testid):
    return _to_json(get_testrun_by_id(testid))
    
    
def get_testruns(testname = None, statuses = None, cursorWS = None):
    lqry = TestRun.query()
    if testname:
        lqry = lqry.filter(TestRun.testname == testname)
    if statuses:
        lqry = lqry.filter(TestRun.status in statuses)
    lqry = lqry.order(-TestRun.started)
    
    lcursor = ndb.Cursor(urlsafe=cursorWS) if cursorWS else None

    lresults, lcursor, lmore = lqry.fetch_page(5, start_cursor = lcursor)

    return {
        "results": [
            _to_json(ltestRun)
            for ltestRun in lresults
        ],
        "cursor": lcursor.urlsafe() if lmore else None
    }

def cancel_test_run(testrun):
    if testrun:
        testrun.cancel()
        

def delete_test_run(testrun):
    if testrun:
        testrun.cancel()
        testrun.key.delete()

_loadedfiles = {}
def get_web_file_as_string(aFileName):
    retval = None
    if aFileName:
        lcombinedName = "web/%s" % (aFileName)
        if not lcombinedName in _loadedfiles:
            lfilePath = os.path.join(os.path.dirname(__file__), lcombinedName)
            lfileContent = None
            print lfilePath
            try:
                f = open(lfilePath)
                try:
                    lfileContent = f.read()
                finally:
                    f.close()
            except IOError, _:
                pass
            _loadedfiles[lcombinedName] = lfileContent
        retval = _loadedfiles[lcombinedName]
        print retval
    return retval
    