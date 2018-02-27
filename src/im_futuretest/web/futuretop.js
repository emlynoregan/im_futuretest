var FutureTop = Vue.component('futuretop', {
  props: [ "futurekey" ],
  template: `
    <div>
	    <md-button @click="navtotests">back to tests</md-button>
	    <div>
			<md-list>
			  <future :futurekey="futurekey" :key="futurekey"/>
			</md-list>
		</div>
	</div>
  `,
  created: function () {
	  this.$emit("title", "Future Browser");
  },
  computed: {
  },
  methods: {
	navtotests()
	{
		this.$router.push("/")
	}
  }
})