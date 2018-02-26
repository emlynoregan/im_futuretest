Vue.component('runs-list-item', {
	  template: `
		  <md-list-item>
			<div style="width:100%" class="md-layout md-gutter">
			    <div class="md-layout-item md-size-5">
		  			<md-icon :class="iconclass">{{icon}}</md-icon>
		  		</div>
			    <div class="md-layout-item">
				    <span class="md-list-item-text">
					  <span>{{run.id}} ({{run.testname}})</span>
					  <span v-if="run_is_underway">
					  	<span>started: {{run.started_desc}}</span>
				  		<md-progress-bar v-if="!run_is_complete" :md-mode="progressmode" :md-value="run.progress"></md-progress-bar>
					  	<span v-if="run.final_runtime_usec">completed: {{run.final_runtime_usec / 1000000}} sec</span>
					  	<span class="md-list-item-text" v-if="run.final_message">message: {{run.final_message}}</span>
			          </span>
				    </span>
		  		</div>
			    <div class="md-layout-item md-size-5">
					<span v-if="run_is_underway">
					    <md-button v-if="!run_is_complete" class="md-icon-button" @click="canceldialog = true">
					      <md-icon>cancel</md-icon>
					    </md-button>
					    <md-button v-if="run_is_complete" class="md-icon-button" @click="deletedialog = true">
					      <md-icon>delete</md-icon>
					    </md-button>
					</span>
			    </div>
			    <div class="md-layout-item md-size-5">
					<span v-if="run_is_underway">
					    <md-button class="md-icon-button" @click="navtofuture">
					      <md-icon>timer</md-icon>
					    </md-button>
					</span>
			    </div>
			    <md-dialog-confirm
			      :md-active.sync="deletedialog"
			      md-title="Delete run?"
			      md-content="Do you wish to permanently delete this run?"
			      md-confirm-text="Yes"
			      md-cancel-text="No"
			      @md-confirm="dodelete" />
			    <md-dialog-confirm
			      :md-active.sync="canceldialog"
			      md-title="Cancel run?"
			      md-content="Do you wish to cancel this run?"
			      md-confirm-text="Yes"
			      md-cancel-text="No"
			      @md-confirm="docancel" />
	        </div>
		  </md-list-item>
	  `,
  props: [
	 "runid"
  ],
  data: function() 
  {
	  return {
		  timer: null,
		  deletedialog: false,
		  canceldialog: false
	  }
  },
  computed: {
	run_is_complete: function(){
		return this.run && (["pass", "fail"].indexOf(this.run.status) >= 0);
	},
	run_is_underway: function(){
		return this.run && (["constructing", "running", "pass", "fail"].indexOf(this.run.status) >= 0);
	},
    run: function() {
	  var retval = store.getters.runs_by_id[this.runid];
		
	  return retval;
    },
	icon: function() {
		switch (this.run.status)
		{
			case "posted": 
				return "more_horiz";
			case "pass": 
				return "check";
			case "fail": 
				return "close";
			default:
				return "directions_run";
		}
	},
	iconclass: function() {
		switch (this.run.status)
		{
			case "pass": 
				return "md-primary";
			case "fail": 
				return "md-accent";
			default:
				return null;
		}
	},
	progressmode: function() {
		return (this.run && this.run.progress > 0) ? "determinate" : "indeterminate";
	}
  },
  methods: 
  {
	"docancel": function() {
		console.log("cancel");
		this.$store.commit("cancel_run", this.runid);
	},
	"dodelete": function() {
		console.log("delete");
		this.$store.commit("delete_run", this.runid);
	},
	navtofuture()
	{
		this.$router.push("/future/" + this.run.futurekey)
	}
  },
})