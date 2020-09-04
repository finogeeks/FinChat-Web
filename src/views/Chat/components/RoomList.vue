<template>
    <div>
        <div class="room-list" v-if="showRoomList" :style="{ height: windowHeight+'px', width: roomListWidth+'px' }">
            <div class="user-container">
              <div class="my-avatar">
                  <img :src="getMmberAvatar(myinfo)" alt="" @error="imgOnError(myinfo)">
              </div>
              <div class="my-name">
                  {{myinfo && myinfo.displayName}}
                  <img @click="showOperateBtn = !showOperateBtn" :class="{'rotate180': showOperateBtn}" class="option-icon" src="@/assets/images/ic_arrow.svg" alt="">
                  <div class="logout-btn" :class="{'active': showOperateBtn}" @click="showQuitModal = true; showOperateBtn = false;">
                  退出登录
                  </div>
              </div>
              <div v-if="showOperateBtn" class="logout-btn-coverlayer" @click="showOperateBtn = false">

              </div>
            </div>
            <div class="room-list-container" 
              :style="{ 'overflow-y': roomListDraging ? 'hidden' : 'auto' }" 
              :class="{'has-dispatch-room': isConsultMode}"
              ref="roomListContainer">
              <div
                  class="room-container"
                  v-for="(item, idx) in roomList" 
                  :key="idx"
                  :class="{'active': item.roomId === viewingRoomId, 'is-top': item.isTop, 'room-list-draging': roomListDraging}"
                  @click="enterRoom(item)"
                  >
                  <div class="avatar-container">
                      <div v-if="item && (item.avatar || item.isDirect)">
                        <img class="room-avatar" 
                          :src="item && item.imgerror ? DEFAULT_AVATAR : getRoomAvatar(item)" alt="" @error="imgOnError(item)">
                      </div>
                      <div class="member-avatar-container" v-else>
                          <img class="member-avatar" v-for="(member,index) in (item.members && item.members.slice(0,4))" 
                          :key="index" 
                          :src="member && member.imgerror ? DEFAULT_AVATAR : getMmberAvatar(member)" 
                          alt=""
                          @error="imgOnError(member)">
                      </div>
                      <div
                        v-if="item.isChannel"
                        class="avatar-wear"
                        >
                        <img src="@/assets/images/room_set_channel.svg" alt="">
                      </div>
                  </div>
                  <div class="room-overview">
                    <div class="room-name">
                        <span 
                        :style="{ 'max-width': (roomListWidth-171)+'px' }"
                        style="
                        display: inline-block;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;">{{item.name}}</span>
                        <div class="room-tag" v-if="item.isSecret">保密</div>
                        <div class="room-tag" v-else-if="item.isChannel && item.isPrivateChannel">私密</div>
                        <span style="float:right;font-size: 12px;color: #999999;flex-grow: 1;text-align: right;">{{getLastMsgTime(item.lastMessage && item.lastMessage.eventTime)}}</span>
                    </div>
                    <div v-if="item.roomEditingMsg && item.roomEditingMsg !== '<br>' && item.roomId !== viewingRoom.roomId" class="room-lastmessage">
                        <span class="m-alert" >[草稿]</span>
                        {{computeRoomEditingMsg(item.roomEditingMsg)}}
                    </div>
                    <div v-else class="room-lastmessage">
                        <span class="m-alert" v-if="showAlertMsg(item)">[有人@我]</span>
                        {{getLastMsg(item.lastMessage, item)}}
                    </div>
                  </div>
                  <div class="room-tip">
                    <div v-if="item.isMute" style="display: flex;align-items: center;">
                      <img src="@/assets/images/ic_mute.svg" alt="">
                    </div>
                    <div v-if="item.isMute && item.unread" class="mute-unread">
                        
                    </div>
                    <div v-if="!item.isMute && item.unread" class="unread">
                      {{item.unread}}
                    </div>
                  </div>
              </div>
            </div>
        </div>
        <Modal class="quit-confirm-modal" v-model="showQuitModal" width="360" :closable="false" :mask-closable="false">
            <p>
                <Icon style="color: #ff9900;font-size: 20px;vertical-align: middle;margin-right: 4px;" type="ios-information-circle"></Icon>
                <span class="quit-text">确定退出登录吗？</span>
            </p>
            <div slot="footer">
                <Button @click="cancleQuit">取消</Button>
                <Button type="primary" @click="confirmQuit">确定</Button>
            </div>
        </Modal>
    </div>
</template>

<script lang="js">
import { mapState } from 'vuex';
import { IAM_INFO_KEY, BASE_URL, WEB_NAME } from '@/commonVariable';
import IAM from '@/model/iam';
import emojione from 'emojione';

const Matrix = window.matrix;

export default {
  components: {
      
  },
  props: ['viewingRoomId', 'isConsultMode'],
  data() {
    return {
      DEFAULT_AVATAR: require("@/assets/images/default__avatar.png"),
      showOperateBtn: false,
      showQuitModal: false,
      drafts: [],
      confirmFile: {},
      uploadQueue: [],
      showGotoBottomBtn: false,
      faviconSwitch: null,
      oriScrollTop: null,
    };
  },
  mounted() {
    // console.log('ROOMLIST MOUNTED');
    // console.log(this.hasUnread);
    if (this.hasUnread) {
      this.switchFavicon();
    }
  },
  methods: {
    computeRoomEditingMsg(editMsg) {
      // console.log(editMsg);
      let str = editMsg.replace(/<span>/g, '').replace(/<\/span>/g, '').replace(/<br>/g, '\n').replace(/&nbsp;/g, ' ');

      // parse emojione img tags
      const emojitags = str.match(/<img class="emojione" .+?>/g);
      emojitags && emojitags.length && emojitags.forEach((item) => {
        const emoji = item.match(/alt="(.+?)"/);
        str = str.replace(item, emoji[1]);
      });

      // parse atlist
      const idlist = [];
      const signals = [];
      let matchItem = /<label data-user-id="(.+?)" .+?>(.+?)<\/label>/g.exec(str);
      while (matchItem) { //eslint-disable-line
        idlist.push(matchItem[1]);
        str = str.replace(matchItem[0], matchItem[2]);
        signals.push({
          start: matchItem.index,
          end: matchItem.index + matchItem[2].length,
          type: '@',
          val: matchItem[1],
        });
        matchItem = /<label data-user-id="(.+?)" .+?>(.+?)<\/label>/g.exec(str);
      }
      str = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      return str;
    },
    switchFavicon() {
      clearInterval(this.faviconSwitch);
      this.faviconSwitch = null;
      let signal = false;
      this.faviconSwitch = setInterval(() => {
        this.changeImgAndTitle(signal);
        signal = !signal;
      }, 1000);
    },
    stopSwitchFavicon() {
      clearInterval(this.faviconSwitch);
      this.faviconSwitch = null;
      this.changeImgAndTitle(true);
    },
    changeImgAndTitle(signal) {
      const head = document.getElementsByTagName('head')[0];
      const iconlinks = Array.prototype.filter.call(head.childNodes, e => e.rel === 'icon');
      iconlinks.forEach(e => {
        e.href = signal ? "./old_favicon.png" : "./new_favicon.png";
      });
      const titles = document.getElementsByTagName('title');
      Array.prototype.filter.call(titles, e => {
        e.innerHTML = signal ? WEB_NAME : `${WEB_NAME}(${this.hasUnread})`;
      });
    },
    async enterRoom(room) {
        this.$emit('enterRoom', room);
    },
    getRoomAvatar(room) {
      if (!window.matrix) return;
      if (!window.matrix.user) return;
      if (room.avatar) {
        return window.matrix.user.mxcTransfer(room.avatar || '');
      } else {
        return this.DEFAULT_AVATAR;
      }
    },
    getMmberAvatar(member) {
      if (!window.matrix) return;
      if (!window.matrix.user) return;
      if (!member) return '';
      if (member && member.avatarUrl) {
        return window.matrix.user.mxcTransfer(member.avatarUrl || '');
      } else {
        return this.DEFAULT_AVATAR;
      }
    },
    imgOnError(room) {
      room.imgerror = true;
      this.$forceUpdate();
    },
    getLastMsgTime(time) {
      const timeObj = new Date(+time);
      const nowDate = new Date();
      if (!time) return '';
      if (
        timeObj.getFullYear() === nowDate.getFullYear() &&
        timeObj.getMonth() === nowDate.getMonth() &&
        timeObj.getDate() === nowDate.getDate()
      ) {
        return `${timeObj.getHours() > 12 ? '下午': '上午'}${timeObj.getHours() > 12 ? timeObj.getHours() - 12 : timeObj.getHours()}:${timeObj.getMinutes() > 9 ? '' : 0}${timeObj.getMinutes()}`
      } else {
        return `${timeObj.getMonth()+1}/${timeObj.getDate()}`;
      }
    },
    getLastMsg(item, room) {
      if (!item) return '';
      // console.log(item);
      // let msg = {
      //   body: '',
      //   type: '',
      // }
      if (item.senderId === this.myinfo.userId || item.msgType === 'notice' || room.isDirect) {
        return item.msgBody;
      } else {
        return `${item.sender}:${item.msgBody}`
      }
    },
    cancleQuit() {
      this.showQuitModal = false;
      this.showOperateBtn = false;
    },
    async confirmQuit() {
      await IAM.logout();
      indexedDB.deleteDatabase('matrix-js-sdk:default');
      window.localStorage.removeItem(IAM_INFO_KEY);
      this.stopSwitchFavicon();
      window.matrix.stop();
      window.matrix = null;
      this.$router.push('/login');
    },
    showAlertMsg(item) {
      return item.totlaunread > 0 && item.highlightunread > 0;
    },
  }, 
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable', 'roomListWidth', 'roomListDraging']),
    roomList() {
      console.log('VUEX STORE: roomList');
      const roomList = this.$store.state.roomList.filter(e => !e.isDelete);
      console.log(roomList);
      const roomListContainer = this.$refs.roomListContainer;
      if (this.roomListDraging) {
        const scrollTop = roomListContainer.scrollTop;
        const start = Math.floor(scrollTop/60);
        const end = Math.floor(this.windowHeight / 60)+1+start;
        this.oriScrollTop = scrollTop;
        this.$nextTick(() => {
          roomListContainer && (roomListContainer.scrollTop = (scrollTop%60));
        })
        return roomList.slice(start,end);
      } else {
        return roomList;
      }
    },
    hasUnread() {
      return this.roomList.reduce((totle, room) => {
        return totle + (room.isMute ? 0 : room.unread);
      }, 0);
    },
    viewingRoom() {
      return this.roomList.find(room => room.roomId === this.viewingRoomId) || {};
    },
  },
  watch: {
    roomListDraging(val) {
      const roomListContainer = this.$refs.roomListContainer;
      if (!val) {
        this.$nextTick(() => {
          roomListContainer && this.oriScrollTop !== null && (roomListContainer.scrollTop = this.oriScrollTop);
        });
      }
    },
    hasUnread (val) {
      if (val) {
        this.switchFavicon();
      } else {
        this.stopSwitchFavicon();
      }
    }
  },
}
</script>

<style lang="scss">
    .room-list{
      // width: 241px;
      border-right: 1px solid #f5f5f6;
      background-color: #ffffff;
      .user-container{
        display: flex;
        height: 69px;
        box-sizing: border-box;
        font-family: PingFangSC-Regular;
        font-size: 16px;
        font-weight: normal;
        font-stretch: normal;
        letter-spacing: 0px;
        color: #333333;
        padding: 15px 14px;
        .my-avatar{
          width: 40px;
          height: 40px;
          img{
            width: 100%;
            height: 100%;
            border-radius: 4px;
          }
        }
        .my-name{
          max-width: 169px;
          padding-left: 10px;
          display: flex;
          align-items: center;
          font-family: PingFangSC-Regular;
          font-size: 16px;
          font-weight: normal;
          font-stretch: normal;
          letter-spacing: 0px;
          color: #333333;
          position: relative;
          .option-icon{
            margin-left: 5px;
            cursor: pointer;
            &.rotate180{
              transform: rotate(180deg);
            }
          }
          .logout-btn{
            position: absolute;
            left: calc(100% + 10px);
            display: none;
            width: 106px;
            padding: 5px 20px;
            background-color: #ffffff;
            cursor: pointer;
            user-select: none;
            border: 1px solid #cccccc;
            border-radius: 5px;
            z-index: 3;
            &.active{
              display: block;
            }
          }
        }
        .logout-btn-coverlayer{
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 2;
          background: transparent;
        }
      }
      .to-consult{
        height: 50px;
        padding: 10px 16px;
        line-height: 30px;
        .to-consult-btn{
          color: #FFF;
          background-color: #12B6CC;
          line-height: 30px;
          border-radius: 5px;
          float: right;
          padding: 0 10px;
          cursor: pointer;
        }
      }
      .room-list-container{
        height: calc(100% - 69px);
        box-sizing: border-box;
        // overflow-y: auto;
        position: relative;
        &.has-dispatch-room{
          height: calc(100% - 119px);
        }
        .room-container{
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
          height: 60px;
          padding: 10px 16px;
          font-family: PingFangSC-Medium;
          font-size: 14px;
          font-weight: normal;
          font-stretch: normal;
          letter-spacing: 0px;
          color: #333333;
          user-select: none;
          &::after{
            content: '  ';
            position: absolute;
            background-color: rgba(0, 0, 0, 0.05);
            bottom: 0;
            right: 0;
            height: 1px;
            left: 16px;
          }
          &.active{
            background-color: #dfdfdf;
          }
          &.is-top::before{
            content: ' ';
            position: absolute;
            background-color: #4285F4;
            top: -5px;
            right: -5px;
            height: 10px;
            width: 10px;
            transform: rotate(45deg);
          }
          display: flex;
          .avatar-container{
            width: 40px;
            flex-shrink: 0;
            position: relative;
            .room-avatar{
              width: 40px;
              height: 40px;
              border-radius: 4px;
            }
            .avatar-wear{
              position: absolute;
              width: 15px;
              height: 15px;
              right: -2px;
              bottom: -2px;
            }
            .member-avatar-container{
                display: flex;
                flex-wrap: wrap;
                border-radius: 4px;
                overflow: hidden;
                width: 100%;
                height: 100%;
                justify-content: center;
                align-items: center;
                background-color: #e4e7ed;
              .member-avatar{
                width: 19.5px;
                height: 20px;
                flex-shrink: 0;
              }
            }
          }
          .room-overview{
            width: calc(100% - 40px);
            padding-left: 10px;
            display: flex;
            flex-direction: column;
            .room-name{
              // width: 159px;
              width: 100%;
              overflow: hidden;
              text-overflow:ellipsis;
              white-space: nowrap;
              display: flex;
              align-items: center;
              .room-tag {
                height: 16px;
                width: 30px;
                border: 1px solid #4285F4;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                flex-shrink: 0;
                color: #4285F4;
                font-size: 10px;
                margin-left: 5px;
              }
            }
            .room-lastmessage{
              // width: 159px;
              width: 100%;
              overflow: hidden;
              text-overflow:ellipsis;
              white-space: nowrap;
              font-family: PingFangSC-Regular;
              font-size: 10px;
              font-weight: normal;
              font-stretch: normal;
              letter-spacing: 0px;
              color: #999999;
              .m-alert{
                color: red;
              }
            }
          }
          .room-tip{
            position: absolute;
            height: 14px;
            bottom: 13px;
            right: 10px;
            display: flex;
            align-items: center;
            .unread{
              position: relative;
              background: #ff4240;
              color: #ffffff;
              padding: 0 3px;
              border-radius: 7px;
              text-align: center;
              line-height: 14px;
              font-size: 12px;
            }
            .mute-unread{
              width: 8px;
              height: 8px;
              display: inline-block;
              background: #ff4240;
              border-radius: 50%;
              margin-left: 3px;
            }
          }
        }
      }
    }
.quit-confirm-modal{
  .quit-text{
    font-family: PingFangSC-Regular;
    font-size: 14px;
    font-weight: normal;
    font-stretch: normal;
    line-height: 22px;
    letter-spacing: 0px;
    color: rgba(0, 0, 0, 0.65);
    vertical-align: middle;
  }
}
      *::-webkit-scrollbar{
        width: 5px;
        height: 5px;
      }

      *::-webkit-scrollbar-thumb{
        border-radius: 1em;
        background-color: rgba(50,50,50,.3);
      }
      
      *::-webkit-scrollbar-track{
        border-radius: 1em;
        background-color: rgba(50,50,50,.1);
      }
</style>


