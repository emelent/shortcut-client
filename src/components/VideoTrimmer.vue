<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.container {
  position: relative;
  margin: auto;
}

.duration {
  position: absolute;
  top: 0%;
  left: 0px;
  right: 0px;
  width: 100%;
  margin: auto;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 10px;
  box-sizing: border-box; 
  text-align: center;
}

.seekbar {
  position: relative;
  height: 20px;
  background: yellowgreen;
}

.handle {
  position: absolute;
  top: 100%;
  height: 20px;
  background: red;
}

.playbar {
  position: absolute;
  height: 100%;
  background: blue;
}

.frame-loader {
  position: absolute;
  top: 0;
  background: rgba(0, 0, 0, 0.8);
  width: 640px;
  height: 360px;
}
</style>
<template>
  <div class="container" ref="container"
    :style="{width: `${playerWidth}px`}"
  >
    <video 
      ref="video"
      :src="videoUrl" 
      :width="playerWidth"
      @loadeddata="onVideoLoadedData"
      @seeked="onVideoSeeked"
      @click="onVideoClicked"
     >
      Your browser does not support the video tag.
    </video> 
    <div v-if="frameLoading" class="frame-loader"></div>
    <div class="duration">{{clipDuration}}s</div>
    <div class="seekbar">
      <div class="playbar" :style="playbarStyle"></div>
      <button 
        class="handle"
        :style="leftHandleStyle"
        @mousedown="onLeftHandleMouseDown"
        @mouseup="onMouseUp"
      />
      <button 
        class="handle"
        :style="rightHandleStyle"
        @mousedown="onRightHandleMouseDown"
        @mouseup="onMouseUp"
      />
    </div>
    <button class="trim" @click="onTrimButtonClick">Trim</button>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { start } from 'repl';

function toHHMMSS(seconds: number): string {
  return new Date(seconds * 1000).toISOString().substr(11, 8)
}

@Component
export default class VideoTrimmer extends Vue {
  @Prop() private audioUrl!: string 
  @Prop() private videoUrl!: string 

  private audio!: HTMLAudioElement
  private video!: HTMLVideoElement
  
  containerX!: number
  videoDuration: number = 60

  handleWidth: number = 20
  startSeconds: number = 0
  endSeconds: number = 60
  playerWidth: number = 640
  leftHandleActive: boolean = false
  rightHandleActive: boolean = false
  isPlaying: boolean = false
  frameLoading: boolean = false
  playTimeoutId: any

// lifecycle

  created() {
    this.audio = new Audio(this.audioUrl)
  }

  mounted() {
    this.containerX = (this.$refs.container as HTMLElement).getBoundingClientRect().x
    this.video = this.$refs.video as HTMLVideoElement
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
  }

  destroyed() {
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    if(this.playTimeoutId) {
      clearTimeout(this.playTimeoutId)
      this.playTimeoutId = null
     }
  }


// computed

  get startX(): number {
    const x=(this.startSeconds / this.videoDuration) * this.playerWidth - (this.handleWidth)
    return x
  }

  get endX(): number {
    const x = (this.endSeconds / this.videoDuration) * this.playerWidth - (this.handleWidth)
    return x
  }

  get leftHandleStyle(): object {
    const left = `${this.startX + (this.handleWidth / 2)}px`
    return {
      width: `${this.handleWidth}px`,
      left
    }
  }

  get rightHandleStyle(): object {
    const left = `${this.endX + (this.handleWidth / 2)}px`
    return {
      width: `${this.handleWidth}px`,
      left
    }
  }

  get clipDuration(): number {
    const x = Math.max(this.endSeconds - this.startSeconds, 0) * 10
    return Math.round(x) / 10
  }

  get playbarStyle(): object {
    const left = `${(this.startSeconds / this.videoDuration) * this.playerWidth}px`
    const width = `${(this.clipDuration / this.videoDuration) * this.playerWidth}px`
    return {
        width,
        left
    }
  }

// helpers
  pauseVideo() {
    this.audio.pause()
    this.video.pause()
    this.isPlaying = false
    if(this.playTimeoutId){
      clearTimeout(this.playTimeoutId)
      this.playTimeoutId = null
    }
  }
  
  playVideo() {
    this.seekVideo(this.startSeconds)
    this.audio.play()
    this.video.play()
    this.isPlaying = true

    this.playTimeoutId = setTimeout(this.onPlayTimeout, this.clipDuration * 1000)
  }

  seekVideo(pos: number) {
    this.audio.currentTime = pos
    this.video.currentTime = pos
    this.frameLoading = true
  }

// event handlers
  onPlayTimeout() {
    this.playTimeoutId = null
    // reset video
    this.pauseVideo()
    this.seekVideo(this.startSeconds)
  }

  onVideoClicked() {
    if(this.isPlaying) {
      this.pauseVideo()
    } else {
      this.playVideo()
    }
  }

  onVideoSeeking() {
    console.log("seeking...")
  }

  onVideoLoadedData(event: Event) {
    const video: HTMLVideoElement = this.$refs.video as HTMLVideoElement
    this.videoDuration = video.duration
    if(this.endSeconds > this.videoDuration) {
      this.endSeconds = this.videoDuration
    }
    // console.log("video duration =>", video.duration)
  }

  onVideoSeeked(event: Event) {
    console.log("Seeked")
    this.frameLoading = false
  }

  onLeftHandleMouseDown(event: MouseEvent) {
    this.pauseVideo()
    this.leftHandleActive = true
  }

  onRightHandleMouseDown(event: MouseEvent) {
    this.pauseVideo()
    this.rightHandleActive = true
  }

  onMouseMove(event: MouseEvent) {
    const posX = event.clientX - this.containerX
    if(this.leftHandleActive) {
      if(posX < this.handleWidth/2 || posX > this.endX + this.handleWidth*2)
        return

      const x = posX - (this.handleWidth / 2)
      this.startSeconds = (x / this.playerWidth) * this.videoDuration
    } else if (this.rightHandleActive) {
      if(posX > this.playerWidth || posX < this.startX + this.handleWidth)
        return
      const x = posX - (this.handleWidth / 2)
      this.endSeconds = (x / this.playerWidth) * this.videoDuration
    }
  }

  onMouseUp(){
    if(this.leftHandleActive){
      this.seekVideo(this.startSeconds)
    } else if (this.rightHandleActive){
      this.seekVideo(this.endSeconds)
    }
    this.leftHandleActive = false
    this.rightHandleActive = false
  }



  onTrimButtonClick() {
    this.$emit("trimVideo", toHHMMSS(this.startSeconds), toHHMMSS(this.clipDuration))
  }

}
</script>
