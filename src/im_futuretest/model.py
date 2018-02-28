from google.appengine.ext import ndb
from im_future import future, GetFutureAndCheckReady
import uuid
from im_debouncedtask import debouncedtask
import datetime
from im_util import datetime_to_unixtimestampusec

_TEST_RUN_STATUSES = ["constructing", "running", "pass", "fail"]
_TEST_RUN_STATUS_NOT_READY = _TEST_RUN_STATUSES[0]
_TEST_RUN_STATUS_READY = _TEST_RUN_STATUSES[1]
_TEST_RUN_STATUS_PASS = _TEST_RUN_STATUSES[2]
_TEST_RUN_STATUS_FAIL = _TEST_RUN_STATUSES[3]

class TestRun(ndb.model.Model):
    testname = ndb.StringProperty()
    stored = ndb.DateTimeProperty(auto_now_add=True)
    updated = ndb.DateTimeProperty(auto_now=True)
    started = ndb.DateTimeProperty()
    status = ndb.StringProperty()
    progress = ndb.FloatProperty()

    final_runtime_usec = ndb.IntegerProperty()
    final_message = ndb.StringProperty()
    
    futurekey = ndb.KeyProperty()
    
    @classmethod
    def construct_key(cls):
        lid = str(uuid.uuid4())
        return cls.construct_key_for_id(lid)

    @classmethod
    def construct_key_for_id(cls, aId):
        return ndb.Key(TestRun, aId)

    def get_future(self):
        return self.futurekey.get() if self.futurekey else None
            
    @classmethod
    def go(cls, testDef):
        lrunKey = cls.construct_key()
        
        lrun = TestRun(
            key = lrunKey,
            testname = testDef.get("name"),
            status = _TEST_RUN_STATUS_NOT_READY,
            progress = 0,
            
        )

        ltaskkwargs = testDef.get("taskkwargs") or {}
        f = testDef.get("f")

        def calc_final_runtime_usec(aStarted):
            lnow = datetime.datetime.utcnow()
            
            return int(
                (lnow - aStarted).total_seconds() * 1000000
            )
             
        @ndb.transactional(xg=True)
        def onsuccess(futurekey):
            futureobj = GetFutureAndCheckReady(futurekey)

            lrun = lrunKey.get()
            
            if lrun and lrun.status in [_TEST_RUN_STATUS_NOT_READY, _TEST_RUN_STATUS_READY]:
                lrun.status = _TEST_RUN_STATUS_PASS
                lrun.progress = 100
                lresult = futureobj.get_result()
                if lresult:
                    lrun.final_message = str(lresult)
                lrun.final_runtime_usec = calc_final_runtime_usec(lrun.started)
                lrun.put()
        
        @ndb.transactional(xg=True)
        def onfailure(futurekey):
            futureobj = GetFutureAndCheckReady(futurekey)

            lrun = lrunKey.get()
            
            if lrun and lrun.status in [_TEST_RUN_STATUS_NOT_READY, _TEST_RUN_STATUS_READY]:
                lrun.status = _TEST_RUN_STATUS_FAIL
                lrun.progress = 100
                try:
                    futureobj.get_result()
                except Exception, ex:
                    lrun.final_message = str(ex)
                lrun.final_runtime_usec = calc_final_runtime_usec(lrun.started)
                lrun.put()

        @debouncedtask(**ltaskkwargs)
        @ndb.transactional(xg=True)
        def onprogress(futurekey):
            futureobj = GetFutureAndCheckReady(futurekey)

            if futureobj:
                lrun = lrunKey.get()
                if lrun and lrun.status in [_TEST_RUN_STATUS_NOT_READY, _TEST_RUN_STATUS_READY]:
                    lrun.progress = futureobj.get_calculatedprogress()
                    lrun.put()
        
        fut = future(
            f, 
            onsuccessf = onsuccess, 
            onfailuref = onfailure, 
            onprogressf = onprogress, 
            weight = 100,
            **ltaskkwargs
        )()

        lrun.futurekey = fut.key
        lrun.started = datetime.datetime.utcnow()
        lrun.put()
                
        return lrun

    def to_json(self):
        if self.status in [_TEST_RUN_STATUS_NOT_READY, _TEST_RUN_STATUS_READY]:
            lfut = self.get_future()
            lstatus = _TEST_RUN_STATUS_READY if lfut.readyforresult else _TEST_RUN_STATUS_READY
        else:
            lstatus = self.status

        retval = {
            "id": self.key.id(),
            "testname": self.testname,
            "stored": datetime_to_unixtimestampusec(self.stored) if not self.stored is None else None,
            "stored_desc": str(self.stored),
            "updated": datetime_to_unixtimestampusec(self.updated) if not self.updated is None else None,
            "updated_desc": str(self.updated),
            "status": lstatus,
            "started": datetime_to_unixtimestampusec(self.started),
            "started_desc": str(self.started),
            "progress": self.progress,
            "futurekey": self.futurekey.urlsafe() if self.futurekey else None
        }

        if self.status in [_TEST_RUN_STATUS_PASS, _TEST_RUN_STATUS_FAIL]:
            retval.update({
                "final_runtime_usec": self.final_runtime_usec,
                "final_message": self.final_message
            })
        
        return retval

    def cancel(self):
        if not self.status in [_TEST_RUN_STATUS_PASS, _TEST_RUN_STATUS_FAIL]:
            fut = self.futurekey.get() if self.futurekey else None
            
            if fut:
                fut.cancel()    
    