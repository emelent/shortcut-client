<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
<template id="squig">
  <div class="view" id="search">
    <input type="text" v-model="url" placeholder="Youtube Video url" />
    <button @click="fetchUrls">Go</button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Search extends Vue {
  url: string = "";

  fetchUrls(): void {
    this.$emit("fetchUrls", this.url);
  }
}
</script>
