var Test = Vue.component('test', {
//  data: function() {
//	  return {
////		  "statuses": ["underway", "pass", "fail"],
//		  "cursor": null
//	  }
//  },
  props: [ "testname" ], //, "runs_by_test" ],
  template: `
    <div>
	    <md-button @click="navtotests">back to tests</md-button>
	    <div>
			<div v-if="runs.length">
				<md-list class="md-double-line">
				  <runs-list-item v-for="run in runs" :runid="run.id" :key="run.id"/>
				</md-list>
			</div>
			<div v-else>No runs</div>
			<md-button v-if="more" @click=onmore>
			    more
			</md-button>
			<md-button class="md-fab md-fab-top-right" @click=ongo :style="{ zIndex: 9999 }" md-elevation-24>
			    <md-icon>add</md-icon>
			</md-button>
		</div>
	</div>
  `,
  created: function () {
	  this.$emit("title", this.testname);
	  this.getRuns();
  },
  computed: {
	  runs: function() {
		  var ids = store.getters.runids_by_test[this.testname];
		  var retval = _.map(
			ids, 
			function(id) 
			{
				return store.getters.runs_by_id[id];
			}
		  );
			
		  return retval;
	  },
	  more: function()
	  {
		  return store.getters.cursors_by_test[this.testname] != "-";
	  }
  },
  methods: {
	navtotests()
	{
		this.$router.push("/")
	},
    getRuns() 
    {
		if (!this.$store.getters.runids_by_test[this.testname])
			this.$store.commit("load_runids", {testname: this.testname, http: this.$http});
    },
    onmore() 
    {
    	this.$store.commit("load_runids", {testname: this.testname, http: this.$http});
    },
    ongo()
    {
  	  var lquery = {
  		action: "go",
		name: this.testname
	  };

  	  var _app = this;
  	  
      this.$http.post('../tests', lquery).then(
        function (response) 
	    {
        	this.$store.commit("push_run_placeholder", {id: response.data.id, testname: this.testname});
	    }
      );
    }
  }
})