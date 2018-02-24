Vue.component('test-list-item', {
  props: [
	 "test"
  ],
  computed: {
	tagstring: function(){
		return this.test.tags.join(", ")
	}  
  },
  template: `
    <md-list-item @click="navtodetail">
	  	<md-icon>assignment</md-icon>
  		<span class="md-list-item-text">
  			<span>{{test.name}}</span>
	  		<span v-if="tagstring.length > 0 || test.description">(tags: {{tagstring}}) {{test.description}}</span>  
	  	</span>
	</md-list-item>
  `,
  methods: {
	navtodetail()
	{
		this.$router.push("/test/" + this.test.name)
	}
  }
})