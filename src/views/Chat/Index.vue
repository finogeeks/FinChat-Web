<template>
  <div class="chat">
    <div class="chat-container">
      <room-list
        :viewingRoomId="viewingRoomId"
        @enterRoom="enterRoom"
        ></room-list>
      <div class="roomlist-drag-drop" :style="{ left: (roomListWidth-2)+'px' }" @mousedown="dragBegin"></div>
      <join-room
        v-if="showLinkRoom"
        @enterRoom="enterRoom"
        @hideLingRoom="showLinkRoom = false"
        ></join-room>
      <viewing-room
        v-else
        :viewingRoomId="viewingRoomId"
        ref="viewingRoom"
        @quitRoom="viewingRoomId=null"
        ></viewing-room>
    </div>
  </div>
</template>

<script lang="js">
import emitter from '@/utils/event-emitter';
import { mapState } from 'vuex';
import IAM from '@/model/iam.js';
// import RoomList from './components/RoomList.vue';
const RoomList = () => import('./components/RoomList.vue');
// import ViewingRoom from './components/ViewingRoom.vue';
const ViewingRoom = () => import('./components/ViewingRoom.vue');
// import JoinRoom from './components/JoinRoom.vue';
const JoinRoom = () => import('./components/JoinRoom.vue');

export default {
  beforeRouteEnter(to, from, next) {
    next();
  },
  components: {
    'room-list': RoomList,
    'viewing-room': ViewingRoom,
    'join-room': JoinRoom,
  },
  created() {

  },
  data() {
    return {
      viewingRoomId: '',
      showLinkRoom: false,
      timer: null,
      mouseMoveX: 0,
    };
  },
  async mounted() {
    setTimeout(() => {
      this.$store.commit('setShowLoadingMask', false);
      this.$store.commit('setAfterlog', false);
    }, 500);
    console.log(this.$router);
    Notification.requestPermission();
    const enterRoom = () => {
      const room = this.$store.state.roomList.find(e => e.roomId === this.chatRoom);
      if (room) {
        this.enterRoom(room);
      } else {
        this.showLinkRoom = true;
      }
    };
    if (this.chatRoom) {
      if (this.roomsInited) {
        enterRoom();
      } else {
        const interval = setInterval(() => {
          if (this.roomsInited) {
            enterRoom();
            clearInterval(interval);
          }
        }, 500);
      }
    }
  },
  methods: {
    dragBegin() {
      console.log('dragBegin');
      this.$store.commit('setRoomListDraging', true);
      document.addEventListener('mousemove', this.documentMove);
      document.addEventListener('mouseup', this.dragEnd);
    },
    dragEnd() {
      console.log('dragEnd');
      this.$store.commit('setRoomListDraging', false);
      document.removeEventListener('mousemove', this.documentMove);
      document.removeEventListener('mouseup', this.dragEnd);
    },
    documentMove(e) {
      if (e.movementX === 0) return;
      this.mouseMoveX += e.movementX;
      if (this.timer) return;
      this.timer = setTimeout(() => {
        this.$store.commit('setRoomListWidth', this.roomListWidth + this.mouseMoveX);
        clearTimeout(this.timer);
        this.timer = null;
        this.mouseMoveX = 0;
      }, 16);
    },
    afterEnterRoom() {
      setTimeout(async () => {
        await this.$refs.viewingRoom.computeUnread();
      }, 0);
    },
    async enterRoom(room) {
      this.$store.commit('setViewingRoom', room.roomId);
      this.$refs.viewingRoom && this.$refs.viewingRoom.saveEditingMsg(room);
      const sameRoom = this.viewingRoomId === room.roomId;
      if (sameRoom) return;
      this.showLinkRoom = false;
      await window.matrix.viewingRoom.addViewingRoom(room.roomId);
      console.log('1111');
      this.viewingRoomId = room.roomId;
      this.hasOldTimelineTable[this.viewingRoomId] = null;
      // this.afterEnterRoom();
      this.$nextTick(() => {
        this.$refs.viewingRoom && this.$refs.viewingRoom.clearEditingMsg();
        this.$refs.viewingRoom.scrollToBottom();
      });
    },
    whetherSameRoom(roomId) {
      return roomId === this.viewingRoomId;
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable', 'chatRoom', 'roomsInited', 'roomListWidth']),
  },
  watch: {

  },
};
</script>

<style lang="scss">
.chat{
  .chat-container{
    display: flex;
    text-align: left;
  }
  .loading-flag{
    position: relative;
    height: 20px;
    background-color: transparent;
    margin-top: -10px;
  }
}
.roomlist-drag-drop{
  position: absolute;
  width: 4px;
  cursor: col-resize;
  top: 0;
  bottom: 0;
  z-index: 1;
}

.demo-spin-icon-load{
    animation: ani-demo-spin 1s linear infinite;
}
@keyframes ani-demo-spin {
    from { transform: rotate(0deg);}
    50%  { transform: rotate(180deg);}
    to   { transform: rotate(360deg);}
}
</style>


