<template>
  <div id="app" :class="{'room-list-draging': roomListDraging}">
    <router-view ref="chatPage"/>
    <div v-if="showLoadingMask" class="loading-mask">
      <Icon class="icon-load" type="ios-loading" />Loading...
    </div>
  </div>
</template>

<script>
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
import { IAM_INFO_KEY, MSG_TYPE_ALERT, MSG_TYPE } from '@/commonVariable';
import { mapState } from 'vuex';
import { startJwtRefresh, stopJwtRefresh } from './jwtRefresh';

export default {
  beforeRouteEnter(to, from, next) {
    // console.log('router enter app');
    next();
  },
  data() {
    return {
      timer: null,
    };
  },
  created() {
    this.$store.commit('setWindowHeight', window.innerHeight);
    this.$store.commit('setWindowWidth', window.innerWidth);
    this.windowResize();
    emitter.addListener('ROOMS_INIT', (joinRoomMap) => {
      // console.log('ROOMS_INIT');
      const roomlist = cloneDeep(joinRoomMap);
      roomlist.forEach(e => e.roomEditingMsg = '');
      // console.log(roomlist);
      this.$store.commit('initRoomList', roomlist);
      // this.$store.commit('setShowLoadingMask', false);
      this.$store.commit('roomsHasInited');
    });
    emitter.addListener('INIT_TIMELINE', (roomId, roomTimeLine) => {
      // console.log('INIT_TIMELINE');
      // console.log(roomId, roomTimeLine);
      this.$store.commit('initRoomTimeline', { roomId, roomTimeLine: cloneDeep(roomTimeLine) });
    });
    emitter.addListener('TIMELINE_UPDATE', (message, roomId, mxEvent, mxRoom) => {
      // console.log('TIMELINE_UPDATE');
      // console.log(message);
      this.$store.commit('updateRoomTimeline', { message: cloneDeep(message), roomId });
    });
    emitter.addListener('ROOM_UPDATE', (newRoom) => {
      // console.log('ROOM_UPDATE');
      // console.log(newRoom);
      this.$store.commit('updateRoomList', cloneDeep(newRoom));
    });
    emitter.addListener('NEW_MSG_ALERT', async (mxEvent, newRoom) => {
      // console.log(mxEvent, '来消息了');
      // console.log(this.$store);
      const msgContent = mxEvent.event.content;
      const iamInfo = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY));
      const userId = iamInfo ? iamInfo.user_id : null;
      const sender = mxEvent.sender.userId;
      // // console.log(sender, userId);
      const hasMsgType = msgContent.msgtype;
      const isMute = newRoom.isMute;
      const alertMe = msgContent.idlist && (msgContent.idlist.includes(userId) || msgContent.idlist.includes('@all'));
      if (!mxEvent.event.type === 'm.room.message') return; // 房间消息类型
      if (!mxEvent.event.content) return;
      if (!mxEvent.event.content.msgtype) return;
      const msgtype = mxEvent.event.content.msgtype; // 类型字段
      if (sender === userId) return; // 本人消息过滤
      const msgCanAlert = Object.keys(MSG_TYPE_ALERT).some(e => MSG_TYPE_ALERT[e] === msgtype);
      if (!msgCanAlert) return;
      if (!isMute || (isMute && msgContent.msgtype === MSG_TYPE.alert && alertMe)) {
        if (Notification.permission !== 'default') {
          window.focus();
          await Notification.requestPermission();
        }
        const findUser = newRoom.members.find(val => val.userId === mxEvent.sender.userId);
        const senderName = findUser.displayName || findUser.name || findUser.userId;
        let send = '';
        let body = mxEvent.event.content.body;
        if (MSG_TYPE.file === msgtype) body = `[文件]${mxEvent.event.content.body}`;
        if (MSG_TYPE.url === msgtype) body = `[链接]${mxEvent.event.content.info.title || mxEvent.event.content.info.description}`;
        if (MSG_TYPE.video === msgtype) body = '[视频]';
        if (MSG_TYPE.audio === msgtype) body = '[语音]';
        if (MSG_TYPE.location === msgtype) body = '[位置]';
        if (msgtype === 'm.combine_forward' || msgtype === 'm.url' || msgtype === 'm.url' || msgtype === 'm.businesscard') body = '[暂不支持展示该消息类型]';
        if (!newRoom.isDirect) {
          send = `${senderName} :`;
        }
        if (alertMe) {
          send = '';
          body = `[有人@我]${senderName} :${mxEvent.event.content.body}`;
        }
        const notification = new Notification(newRoom.name, {
          dir: 'auto',
          lang: 'hi',
          tag: '',
          body: `${send}${body}`,
          icon: window.matrix.user.mxcTransfer((sender && sender.avatarUrl) || ''),
          silent: true,
          sound: 'http://data.huiyi8.com/yinxiao/mp3/73913.mp3',
        });
        notification.onclick = () => {
          window.focus();
          if (this.$refs.chatPage && this.$refs.chatPage.enterRoom && !this.$refs.chatPage.whetherSameRoom(mxEvent.sender.roomId)) {
            this.$refs.chatPage.enterRoom(newRoom);
          }
          notification.close();
        };
      }
      // if ((hasMsgType && msgCanAlert && !isMute) || (isMute && msgContent.msgtype === MSG_TYPE.alert && alertMe)) {
      //   if (Notification.permission !== 'default') {
      //     window.focus();
      //     await Notification.requestPermission();
      //   }
      //   const iconurl = window.matrix.user.mxcTransfer((sender && sender.avatarUrl) || '');
      //   const notification = new Notification(newRoom.name, {
      //     dir: 'auto',
      //     lang: 'hi',
      //     body: `${newRoom.isDirect ? '' : (`${mxEvent.sender.name}: `)}${newRoom.lastMessage.msgBody}`,
      //     icon: iconurl,
      //     silent: true,
      //     sound: 'http://data.huiyi8.com/yinxiao/mp3/73913.mp3',
      //   });
      //   // // console.log(notification);
      //   notification.onclick = () => {
      //     // // console.log('notification.onclick');
      //     window.focus();
      //     if (this.$refs.chatPage && this.$refs.chatPage.enterRoom && !this.$refs.chatPage.whetherSameRoom(mxEvent.sender.roomId)) {
      //       this.$refs.chatPage.enterRoom(newRoom);
      //     }
      //     notification.close();
      //   };
      // }
    });
    emitter.addListener('USERS_INIT', (usermap) => {
      // console.log('USERS_INIT');
      // console.log(usermap);
      this.$store.commit('initUserList', cloneDeep(usermap));
    });
    emitter.addListener('ROOM_DISPATCH', (dispatchData) => {
      this.$store.commit('updateDispatchData', cloneDeep(dispatchData));
    });
    emitter.addListener('TOKEN_INVALID', () => {
      stopJwtRefresh();
      this.$Message.error('用户TOKEN已失效，请重新登录！');
      window.localStorage.removeItem(IAM_INFO_KEY);
      window.matrix && window.matrix.stop();
      window.matrix = null;
      this.$router.push('/login');
    });
  },
  methods: {
    windowResize() {
      window.onresize = () => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          this.$store.commit('setWindowHeight', window.innerHeight);
          this.$store.commit('setWindowWidth', window.innerWidth);
          // console.log(this.$store.state.windowHeight);
        }, 500);
      };
    },
    controlPageUnload() {
      window.onbeforeunload = () => {
        // alert('onbeforeunload');
        // debugger;
        // return false;
        // window.localStorage.removeItem(IAM_INFO_KEY);
        // window.matrix.stop();
        // window.matrix = null;
        // this.$router.push('/login');
      };
      window.onunload = (event) => {
        // console.log('onunload');
        // window.localStorage.removeItem(IAM_INFO_KEY);
        // window.matrix.stop();
        // window.matrix = null;
        // this.$router.push('/login');
        // 鼠标相对于用户屏幕的水平位置 - 窗口左上角相对于屏幕左上角的水平位置 = 鼠标在当前窗口上的水平位置
        const n = window.event.screenX - window.screenLeft;
        // 鼠标在当前窗口内时，n<m，b为false；鼠标在当前窗口外时，n>m，b为true。20这个值是指关闭按钮的宽度
        const b = n > document.documentElement.scrollWidth - 20;
        // 鼠标在客户区内时，window.event.clientY>0；鼠标在客户区外时，window.event.clientY<0
        // console.log(window.event, event, n,b);
        if (b && window.event.clientY < 0 || window.event.altKey || window.event.ctrlKey) {
          // console.log('关闭浏览器');
          // 关闭浏览器时你想做的事
          window.localStorage.removeItem(IAM_INFO_KEY);
          window.matrix.stop();
          window.matrix = null;
          this.$router.push('/login');
        } else if (event.clientY > document.body.clientHeight || event.altKey) {
          // console.log('刷新浏览器');
          // 刷新浏览器时你想做的事
          // alert("刷新");
        }
      };
    },
  },
  computed: {
    ...mapState(['chatRoom', 'roomListDraging', 'showLoadingMask']),
  },
};
</script>>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  .ivu-icon:before,
  .ivu-icon:after {
    font-family: Ionicons !important;
  }
  .loading-mask{
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
  }
  .icon-load{
      animation: ani-spin 1s linear infinite;
  }
  @keyframes ani-spin {
      from { transform: rotate(0deg);}
      50%  { transform: rotate(180deg);}
      to   { transform: rotate(360deg);}
  }
}
.room-list-draging{
  cursor: col-resize!important;
}
.editor-draging{
  cursor: row-resize!important;
}
</style>
