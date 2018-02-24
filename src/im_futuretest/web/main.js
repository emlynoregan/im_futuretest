const routes = [
  { path: '/', component: Tests },
  { path: '/test/:testname', component: Test, props: true }
]

const router = new VueRouter({
	  routes // short for `routes: routes`
	})


Vue.use(VueMaterial.default)

const store = new Vuex.Store({
  state: {
    runids_by_test: {},
	runs_by_id: {},
    cursors_by_test: {}
  },
  getters: {
    runids_by_test: state => { return state.runids_by_test; },
    runs_by_id: state => { return state.runs_by_id; },
    cursors_by_test: state => { return state.cursors_by_test; }
  },
  mutations: {
    load_runids: function(state, payload)
    {
    	var testname = payload.testname;
    	
    	if (state.cursors_by_test[testname] != "-")
    	{
			var lquery = {
				name: testname,
				cursor: state.cursors_by_test[testname]
			};
	
			payload.http.get('../runs', {params: lquery}).then(
			    function (response) 
			    {
				      var copyIds = Object.assign({}, state.runids_by_test);
				      var copyCursors = Object.assign({}, state.cursors_by_test);
	
				      var newIds = _.map(
			    		  response.data.results, 
			    		  function(item)
			    		  {
			    			  return item.id;
			    		  }
				      );
	
				      if (copyIds[testname])
				      {
				    	  copyIds[testname] = copyIds[testname].concat(newIds);
				      }
				      else
				      {
				    	  copyIds[testname] = newIds;
				      }
				    	  
				      response.data.results.forEach(function(run){
				    	  _push_run(state, run.id, run);
				      })
				      
				      copyCursors[testname] = response.data.cursor ? response.data.cursor : "-";
				      
				      state.runids_by_test = copyIds;
				      state.cursors_by_test = copyCursors;
			    }
			);
    	}
    },
    load_run: function(state, id)
    {
		var lquery = {
			id: id
		};

		payload.http.get('../runs', {params: lquery}).then(
		    function (response) 
		    {
		    	_push_run(state, id, response.data);
		    }
		);
    },
    push_run_with_wait: function(state, payload)
    {
    	_push_run(state, payload.id, payload.run);
    },
    push_run_placeholder: function(state, payload)
    {
    	if (!state.runs_by_id[payload.id])
    	{
    		var run = {
    			id: payload.id,
    			testname: payload.testname || "unknown",
    			status: "posted"
    		}

    		_push_run(state, payload.id, run)
    		_push_id(state, payload.id, payload.testname)
    	}
    },
    cancel_run: function(state, id)
    {
	    app.$http.post('../runs', {action: "cancel", id: id}).then(
			    function (response) 
			    {
			    	console.log(response);
			    }
			);
    },
    delete_run: function(state, id)
    {
	    app.$http.post('../runs', {action: "delete", id: id}).then(
		    function (response) 
		    {
		    	console.log(response);
		    }
		);

	    var run = state.runs_by_id[id];
	    
		var copyTests = Object.assign({}, state.runids_by_test);
		var copyRuns = Object.assign({}, state.runs_by_id);
		
		copyTests[run.testname] = _.filter(copyTests[run.testname], function(aid){
			return aid != id;
		});
		
		delete copyRuns[id];
		
		state.runids_by_test = copyTests;
		state.runs_by_id = copyRuns;
    }
  }
});

var _push_id = function(state, id, testname)
{
	if (state.runids_by_test[testname].indexOf(id) < 0)
	{
	  var copyIds = Object.assign({}, state.runids_by_test);
    
	  copyIds[testname].unshift(id);

      state.runids_by_test = copyIds;
	}
}

var _push_run = function(state, id, run)
{
	var copyRuns = Object.assign({}, state.runs_by_id);
	
	copyRuns[id] = run;
	  
	state.runs_by_id = copyRuns;
	
	_monitor_run(state, id);

}

var _monitor_run = function(state, id)
{
	var run = state.runs_by_id[id];
	
	if (run && ["pass", "fail"].indexOf(run.status) < 0)
	{
		setTimeout(
	    	function wait_for_run() {
	            app.$http.get('../runs', {params: {id: id}}).then(
				    function (response) 
				    {
				    	console.log(response);
				    	
				    	if (response.data)
				    	{
				    		this.$store.commit("push_run_with_wait", {id: id, run: response.data});
				    	}
				    }
				);
	    	},
			2000
		);
	}
}


var app = new Vue({
  el: '#app',
  store,
  data: {
    title: '...'
  },
  methods: {
    ontitle: function(title) {
    	this.title = title;
    }
  },
  router
});