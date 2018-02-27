var Future = Vue.component('future', {
  props: [ "futurekey" ],
  template: `
    <div>
	  <md-list-item>
	    <div style="width:100%">
	      <div style="width:100%">
			<div style="width:100%" class="md-layout md-gutter">
		  		<div class="md-layout-item md-size-5">
				    <div>
			  			<md-icon :class="iconclass">{{icon}}</md-icon>
			  		</div>
				    <div v-if="fut && fut.expanded" @click="do_contract">
			  			<md-icon>arrow_drop_up</md-icon>
			  		</div>
				    <div v-else @click="do_expand">
			  			<md-icon>arrow_drop_down</md-icon>
			  		</div>
			  	</div>
			    <div class="md-layout-item md-size-95">
				    <span v-if="fut" class="md-list-item-text">
					  <a @click="navtofuture">
					    <span v-if="fut.name">{{fut.id}} ({{fut.name}})</span>
					    <span v-else>{{fut.id}}</span>
					  </a>
					  <span v-if="fut_underway">
					  	<span>stored: {{fut.stored}}</span>
					  	<span>updated: {{fut.updated}}</span>
			          </span>
				  	  <md-progress-bar v-if="!fut_complete" :md-mode="progressmode" :md-value="fut.progress"></md-progress-bar>
					  <span>
					  	<span>runtime: {{fut.runtimesec}} sec</span>
					  	<span v-if="fut.initialised">(init)</span>
					  	<span v-if="fut.readyforresult">(ready)</span>
			          </span>
					  <span>
					  	<span v-if="fut_complete && fut.exception">exception: {{fut.exception}}</span>
						<div v-if="fut_complete && fut.result" style="width:100%" class="md-layout md-gutter">
					  		<div class="md-layout-item md-size-10">
	  							<b>Result</b>
	  						</div>
					  		<div class="md-layout-item md-size-90">
	  							<pre v-if="fut.expanded">{{fut_result_pre}}</pre>
	  							<span v-else>{{fut.result}}</span>
	  						</div>
					  	</div>
			          </span>
				    </span>
		  		</div>
		  	</div>
		  </div>
	      <div v-if="fut && fut.expanded">
			<span v-if="fut.zchildren && fut.zchildren.length > 0">
				<md-list class="md-double-line">
					<future v-for="zfut in fut.zchildren" :futurekey="zfut.futurekey" :key="zfut.futurekey"/>
				</md-list>
			</span>
			<span v-else-if="fut.loaded">
  				no children
			</span>
		  </div>
		</div>
	  </md-list-item>
	</div>
  `,
  created: function () {
	this.$store.commit("load_future", { futurekey: this.futurekey, expanded: false, http: this.$http });
  },
  computed: {
    fut: function() {
  	  var retval = store.getters.futures[this.futurekey];
  		
  	  return retval;
    },
    fut_underway: function() {
      return this.fut && ["underway", "success", "failure"].indexOf(this.fut.status) >= 0;
    },
    fut_complete: function() {
        return this.fut && ["success", "failure"].indexOf(this.fut.status) >= 0;
    },
    fut_result_pre: function() {
        var retval = null;
        
        if (this.fut && this.fut.result)
        	retval = JSON.stringify(this.fut.result, null, 4);
        
        return retval;
    },
	progressmode: function() {
		return (this.fut && this.fut.progress > 0) ? "determinate" : "indeterminate";
	},
    futJSON: function() {
      return JSON.stringify(this.fut, null, 4);
    },
	expand_icon: function() 
	{
		if (this.fut) {
			if (this.fut.expanded)
			{
				return "arrow_drop_up";
			}
			else
			{
				return "arrow_drop_down";
			}
		}
		else
		{
			return "more_horiz";
		}
	},
	icon: function() 
	{
		if (this.fut) {
			switch (this.fut.status)
			{
				case "success": 
					return "check";
				case "failure": 
					return "close";
				default:
					return "directions_run";
			}
		}
		else
		{
			return "more_horiz";
		}
	},
	iconclass: function() 
	{
		if (this.fut)
		{
			switch (this.fut.status)
			{
				case "success": 
					return "md-primary";
				case "failure": 
					return "md-accent";
				default:
					return null;
			}
		}
		else
		{
			return null;
		}
	},
  },
  methods: {
	  do_expand: function() {
		this.$store.commit("load_future", { futurekey: this.futurekey, expanded: true, http: this.$http });
	  },
	  do_contract: function() {
		this.$store.commit("contract_future", { futurekey: this.futurekey, http: this.$http });
	  },
	  navtofuture()
	  {
		this.$router.push("/future/" + this.futurekey)
	  }
  }
})