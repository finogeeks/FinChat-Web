<template>
  <div
      class="event-item"
      :class="{'my-message': eve.sender === myinfo.userId}"
      >
      <user-header
        :eve="eve"
        :viewingRoom="viewingRoom"
        ></user-header>
      <div class="event-content">
          <div class="event-send-info">
          <div class="sender-name">
              {{findUserName(eve)}}
          </div>
          <div class="send-time">
              {{computeTime(eve)}}
          </div>
          </div>
          <div v-if="agentJudge !== 'Safari'" class="event-msgbody">
            <img 
              class="thumbnail-image"
              :src="getImgUrl(eve.content.info.thumbnail_url)" 
              alt=""
              :style="{width: videoWidth+'px'}"
              @click="handleClickImage"
              v-show="!play"
              >
            <img v-show="!play" @click="playVideo" class="play-icon" src="../../../assets/message/room_video_play.svg" alt="">
            <video v-show="play" ref="video" :style="{width: videoWidth+'px', height: getVideoHeight}" :src="getVideoUrl(eve.content.url)" controls="controls">
              您的浏览器不支持 video 标签。
            </video>
          </div>
          <div class="event-msgbody" v-if="agentJudge === 'Safari'" style="user-select: none;color: #888888;">
            video在Safari浏览器无法正常播放，建议使用Chrome浏览器查看
          </div>
      </div>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
import { mapState } from 'vuex';
import { agentJudge } from '@/utils.js';
import Header from '@/components/Header';

export default {
  name: 'VidwoMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
      play: false,
      DEFAULT_AVATAR: require("../../../assets/images/default__avatar.png"),
      agentJudge,
      hasLoaded: false,
    };
  },
  components: {
    'user-header': Header,
  },
  async mounted() {
      // console.log(this.eve);
  },
  methods: {
    findUserName(eve) {
      // console.log('video message  findusername');
      // console.log(eve.sender);
      // console.log(this.userList.get(eve.sender));
      return this.userList.get(eve.sender).displayName;
    },
    computeTime(eve) {
      if (this.$moment(new Date()).format('YYYYMMDD')>this.$moment(eve.time).format('YYYYMMDD')) {
        return this.$moment(eve.time).format('YYYY年MM月DD日 HH:mm');
      } else {
        return this.$moment(eve.time).format('HH:mm');
      }
    },
    getImgUrl(url) {
      if (!url) return '';
      return window.matrix.user.mxcTransfer(url || '');
    },
    handleClickImage() {
      // window.onOpenPluginLink(this.getImgUrl(this.eve.content.url));
    },
    playVideo() {
      this.play = true;
      this.$refs.video.play();
    },
    getVideoUrl(url) {
      // return `https://api.finogeeks.club/api/v1/netdisk/download/5d847ee771947800019276f5?access_token=MDAxY2xvY2F0aW9uIGZpbm9nZWVrcy5jbHViCjAwMjhpZGVudGlmaWVyIEBqaWFuZ3h1ZTpmaW5vZ2Vla3MuY2x1YgowMDEwY2lkIGdlbiA9IDEKMDAyYmNpZCB1c2VyX2lkID0gQGppYW5neHVlOmZpbm9nZWVrcy5jbHViCjAwMTZjaWQgdHlwZSA9IGFjY2VzcwowMDIxY2lkIG5vbmNlID0gUF8zem1SRFR5OERTVkg0TwowMDI5Y2lkIGRpZCA9IHZpcnR1YWw6MTYxMzAxNDY2MzU3Njk0NDY0CjAwMWFjaWQgZGlkVHlwZSA9IHZpcnR1YWwKMDAxY2NpZCBkZXZpY2VJZGVudGlmaWVyID0gCjAwMThjaWQgdHMgPSAxNTY5MTQ0NTg0CjAwMTVjaWQgaHVtYW4gPSB0cnVlCjAwMmZzaWduYXR1cmUg785mXyWAZ3b7EnqQOi3LwvNvDSfr8_z5dEol_W176CAK&jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmY2lkIjoiQGppYW5neHVlOmZpbm9nZWVrcy5jbHViIiwiaXNzIjoiZjNQdmhSdDR5dDVzTDZQbENDMUltVzlzOFdEUnFpRWEiLCJpYXQiOjE1NjkxNDQ1NzV9.j_GD6pg9Qb4_FnemcW_nMWzKqeMU9yaCCmdC0vdk3yo`;
      return window.matrix.user.mxcTransfer(url || '', );
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
    videoWidth() {
      const videoinfo = this.eve.content.info.thumbnail_info;
      const {w} = videoinfo;
      const maxWidth = (this.windowWidth - 241) * 0.3;
      return Math.min(w/3,maxWidth);
    },
    getVideoHeight() {
      const videoinfo = this.eve.content.info.thumbnail_info;
      const {h,w} = videoinfo;
      const height = (this.videoWidth / w) * h;
      return height+'px';
    },
  },
}
</script>

<style lang="scss" scoped>

.event-item{
    display: flex;
    margin-top: 10px;
    &.my-message{
      flex-direction: row-reverse;
      .event-content{
        padding-left: 0;
        padding-right: 8px;
        display: flex;
        flex-direction: column;
        .event-send-info{
          flex-direction: row-reverse;
          .sender-name{
              margin-right: 0;
              display: none;
          }
          .send-time{
              
          }
        }
        .event-msgbody{
          background-color: #cde6ff;
          align-self: flex-end;
          position: relative;
        }
      }
    }
    .header{
      img{
          width: 30px;
          height: 30px;
          border-radius: 3px;
      }
      .user-avatar{
        opacity: 0;
        &.loaded{
          opacity: 1;
        }
      }
    }
    .event-content{
    padding-left: 8px;
    .event-send-info{
        display: flex;
        font-family: HelveticaNeue;
        font-size: 12px;
        font-weight: normal;
        font-stretch: normal;
        line-height: 14px;
        letter-spacing: 0px;
        color: #999999;
        .sender-name{
          margin-right: 18px;
        }
        .send-time{

        }
    }
    .event-msgbody{
        background-color: #ffffff;
        border-radius: 4px;
        padding: 8px 10px;
        margin-top: 6px;
        display: inline-block;
        word-break: break-all;
        position: relative;
        .play-icon{
          position: absolute;
          width: 30%;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          cursor: pointer;
        }
    }
    }
}
</style>
