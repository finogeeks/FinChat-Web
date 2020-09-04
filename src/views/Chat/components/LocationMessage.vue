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
          <div class="event-msgbody" @click="openLocateUrl">
            <div class="locate-icon">
              <img src="../../../assets/message/location_n.png" alt="">
            </div>
            <div class="locate-info">
              <div class="locate-name">
                {{eve.content.info.name}}
              </div>
              <div class="locate-address">
                {{eve.content.info.address}}
              </div>
            </div>
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
  name: 'LocationMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
        play: false,
      DEFAULT_AVATAR: require("../../../assets/images/default__avatar.png"),
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
      return window.matrix.user.mxcTransfer(url || '', );
    },
    openLocateUrl() {
      window.open (`http://ditu.amap.com/regeo?lng=${this.eve.content.info.longitude}&lat=${this.eve.content.info.latitude}`,
      'newwindow',
      `height=${this.windowHeight*0.6},
      width=${this.windowWidth*0.6},
      top=${this.windowHeight*0.2},
      left=${this.windowWidth*0.2},
      toolbar=no,
      menubar=no,
      scrollbars=no,
      resizable=no,
      location=no,
      status=no`) 
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
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
          display: inline-flex;
          word-break: break-all;
          cursor: pointer;
          .locate-icon{
            >img{
              height: 50px;
            }
          }
          .locate-info{
            margin-left: 10px;
            display: inline-flex;
            flex-direction: column;
            justify-content: center;
            width: 150px;
            .locate-name{
              font-size: 16px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .locate-address{
              font-size: 14px;
              color: #adadad;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }
      }
    }
}
</style>
