<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

.download{
  display: block;
  width: 150px;
  margin: 20px auto;
  background: lightseagreen;
  padding: 10px;
  color: #333;
  font-weight: bold;
}
</style>
<template>
  <div id="app">
    <h2 v-if="!serverAwake">Waking up server ...</h2>
    <Search 
      v-if="search && serverAwake"
      @fetchUrls="fetchUrls"
   />
    <VideoTrimmer 
      v-if="!search && !downloadReady"
      :audioUrl="audioUrl"
      :videoUrl="videoUrl"
      @trimVideo="trimVideo"
    />
    <a 
      class="download"
      :href="downloadUrl"
      v-if="downloadReady"
    >Download Video</a>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator"
import Search from "./components/Search.vue"
import VideoTrimmer from "./components/VideoTrimmer.vue"
import * as signalr from '@microsoft/signalr'
import { hubUrl, cuttyServer } from "./constants"

@Component({
  components: {
    Search,
    VideoTrimmer
  },
})
export default class App extends Vue {
  search: boolean = true
  loading: boolean = false
  downloadReady: boolean = false
  serverAwake: boolean = false 

  private connection!: signalr.HubConnection

  audioUrl!: string 
  videoUrl!: string 
  downloadUrl!: string

  created() {
    this.connection = new signalr.HubConnectionBuilder()
      .withUrl(hubUrl)
      .build()

    console.log("connecting")
    this.connection.on("DownloadLink", this.onDownloadLink)
    this.connection.on("AvUrls", this.onAvUrls)
    this.connection.on("ReceiveMessage", this.onReceiveMessage)

    // wake the heroku server
    this.serverAwake = false
    fetch(`${cuttyServer}/api/wakeUp`)
      .then(this.onServerAwake)
  }

  beforeDestroy() {
    console.log("disconnecting")
    this.connection.stop()
  }

  onServerAwake() {
    this.serverAwake = true
    this.connection.start()
  }

  onDownloadLink(url: string) {
    this.loading = false
    this.downloadReady = true
    this.search = true
    this.downloadUrl = url
    console.log("DownloadUrl =>", url)
  }

  onAvUrls(videoUrl: string, audioUrl: string) {
    this.loading = false
    this.search = false
    this.audioUrl = audioUrl
    this.videoUrl = videoUrl
    this.downloadReady = false
    this.search = false
    console.log("AvUrls =>", audioUrl, videoUrl)
  }

  onReceiveMessage(message: string) {
    console.log(message)
  }

  fetchUrls(url: string) {
    console.log("Fetching av urls")
    this.videoUrl = url
    this.connection.invoke("RequestAvUrls", url)
      .catch(err => console.log("Error =>", err))
  }

  trimVideo(start: string, duration: string) {
    this.loading = true
    console.log("video =>", this.videoUrl)
    console.log("start =>", start)
    console.log("duration =>", duration)
    this.connection.invoke("RequestTrimVideo", this.videoUrl, start, duration)
      .catch(err => console.log("Error =>", err))
  }
}
</script>
