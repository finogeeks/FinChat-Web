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
          <div class="event-msgbody">
            <div class="play-icon" :class="{'playing': playing}" @click="audioPlay">
              <!-- <img src="../../../assets/message/voice_receive_play1.svg" alt=""> -->
            </div>
            <div class="time-bar" :style="{width: (10+duration/100)+'px', 'max-width': (windowWidth-241)*50% + 'px'}">

            </div>
            <div class="audio-time">
              {{audioTime}}
            </div>
            <!-- <audio :src="getAudioUrl(eve.content.url)" ref="audioPlayer" class="audio-player"></audio> -->
            <audio class="audio-player" ref="audioPlayer" controls="controls" :src="getAudioUrl(eve.content.url)" @ended="playing = false">
            </audio>
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
import Header from '@/components/Header';

export default {
  name: 'AudioMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
        playing: false,
      DEFAULT_AVATAR: require("../../../assets/images/default__avatar.png"),
      hasLoaded: false,
    };
  },
  components: {
    'user-header': Header,
  },
  async mounted() {
      // console.log('===AudioMessage===');
      // console.log(this.eve);
  },
  methods: {
    findUserName(eve) {
      return this.userList.get(eve.sender).displayName;
    },
    computeTime(eve) {
      if (this.$moment(new Date()).format('YYYYMMDD')>this.$moment(eve.time).format('YYYYMMDD')) {
        return this.$moment(eve.time).format('YYYY年MM月DD日 HH:mm');
      } else {
        return this.$moment(eve.time).format('HH:mm');
      }
    },
    getAudioUrl(url) {
      return window.matrix.user.mxcTransfer(url || '', )+'&mp3=true';
    },
    audioPlay() {
      this.$refs.audioPlayer.play();
      this.playing = true;
    }
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
    duration() {
      return this.eve.content.info.duration;
    },
    audioTime() {
      const duration = this.eve.content.info.duration;
      let seconds = Math.floor(duration / 1000) || '0';
      const minutes = Math.floor(seconds/60) || '0';
      seconds = Math.floor(seconds - minutes*60) || '00';
      return `${minutes}'${seconds}"`;
    },
  },
  watch: {
    playing(val) {
      // console.log('WATCH PLAYING CHANGE');
      // console.log(val);
    }
  }
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
            flex-direction: row-reverse;
            .play-icon{
              transform: rotate(180deg);
            }
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
          height: 34px;
          display: flex;
          align-items: center;
          .play-icon{
            width: 18px;
            height: 18px;
            margin-right: 5px;
            cursor: pointer;
            background-image: url('../../../assets/message/voice_receive_play1.svg');
            &.playing{
              animation: voice 1.5s linear infinite;
            }
          }
          .time-bar{
            height: 3px;
            background-color: transparent;
            margin-right: 5px;
          }
          .audio-time{

          }
          .audio-player{
            display: none;
          }
      }
    }
}
@keyframes voice {
  33% {
    background-image: url('../../../assets/message/voice_receive_play3.svg');
  }
  66% {
    background-image: url('../../../assets/message/voice_receive_play2.svg');
  }
  99% {
    background-image: url('../../../assets/message/voice_receive_play1.svg');
  }
}

// @keyframes voice-reverse {
//   33% {
//     background-image: url('../../../assets/voice_send_play3.svg');
//   }
//   66% {
//     background-image: url('../../../assets/voice_send_play2.svg');
//   }
//   99% {
//     background-image: url('../../../assets/voice_send_play1.svg');
//   }
// }
</style>
