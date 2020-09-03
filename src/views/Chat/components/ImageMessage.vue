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
            <img 
              :src="getImgUrl(eve.content.url)" 
              alt=""
              :style="{width: imgWidth+'px'}"
              @click="showBig = true;"
              @load="imgOnloaded"
              >
          </div>
          <div v-if="showBig" class="big-pic"
              @click.stop="showBig = false">
            <img 
              :src="getImgUrl(eve.content.url)" 
              alt=""
              style="max-height: 100%;max-width: 100%;"
              >
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
  name: 'ImageMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
      DEFAULT_AVATAR: require("../../../assets/images/default__avatar.png"),
      showBig: false,
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
      // console.log(url);
      if (!url) return '';
      return window.matrix.user.mxcTransfer(url || '');
    },
    handleClickImage() {
      // window.onOpenPluginLink(this.getImgUrl(this.eve.content.url));
    },
    imgOnloaded() {
      // console.log('image message onload');
      this.$emit('imgOnloaded');
      this.hasLoaded = true;
      // return true;
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
    imgWidth() {
      const videoinfo = this.eve.content.info;
      const {w} = videoinfo;
      const maxWidth = (this.windowWidth - 241) * 0.3;
      return Math.min(w/3,maxWidth);
    },
    imgHeight() {
      const videoinfo = this.eve.content.info;
      const {h,w} = videoinfo;
      const height = (this.imgWidth / w) * h;
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
          >img{
            cursor: pointer;
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
      }
    }
}
.big-pic{
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
</style>
