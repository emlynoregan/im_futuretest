var Tests = Vue.component('tests', {
  template: `
    <div>
	  <md-field md-clearable>	
      	<label>search by test name or tags</label>
	  	<md-input v-model="searchtext"></md-input>
	  </md-field>
	  <md-list class="md-double-line">
	    <test-list-item v-for="test in tests" :test="test" :key="test.name"/>
	  </md-list>
	</div>
  `,
  data: function() 
  {
	  return {
	    alltests: [],
		searchtext: ""
	  }
  },
  created: function () {
	  this.getTests()
	  this.$emit("title", "Search");
  },
  computed: {
	tests: function() 
	{
		if (!this.searchtext)
		{
			return this.alltests
		}
		else
		{
			var searchelems = this.searchtext.split(" ");
			return _.filter
			(
				this.alltests,
				function(test) 
				{ 
					var matches = _.filter(
						searchelems,
						function(item) {
							var escapedItem = _.escapeRegExp(item);
							
							return item && 
								(
									(test.name.search(escapedItem) >= 0) ||
									(
										_.filter
										(
											test.tags,
											function(tag)
											{
												return tag && tag.search(escapedItem) >= 0;
											}
										).length > 0
									)
								);
						}
					);
					
					return matches.length > 0;
				}
			);
		}
	}
  },
  methods: {
    getTests() 
    {
      this.$http.get('../tests').then(
        function (response) 
	    {
	      this.alltests = response.data;
	    }
      );
    }
  }
})