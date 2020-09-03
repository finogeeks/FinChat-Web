<template>
  <div class="chat">
    <div class="chat-container">
      <room-list
        :viewingRoomId="viewingRoomId"
        @enterRoom="enterRoom"
        :isConsultMode="true"
        ></room-list>
      <viewing-room
        :viewingRoomId="viewingRoomId"
        ref="viewingRoom"
        :isConsultMode="true"
        @quitRoom="viewingRoomId=null"
        ></viewing-room>
    </div>
  </div>
</template>

<script lang="js">
import emitter from '@/utils/event-emitter';
import { mapState } from 'vuex';
import RoomList from './components/RoomList.vue';
import ViewingRoom from './components/ViewingRoom.vue';

export default {
  beforeRouteEnter(to, from, next) {
    next();
  },
  components: {
    'room-list': RoomList,
    'viewing-room': ViewingRoom,
  },
  created() {
    
  },
  data() {
    return {
      viewingRoomId: '',
    };
  },
  mounted() {
    // this.$store.commit('setShowRoomList', false);
    emitter.addListener('ROOMS_INIT', (joinRoomMap) => {
      setTimeout(() => {
          // this.enterRoom({ roomId: '!161197728964018176:finogeeks.club' });
      }, 0);
    });
  },
  methods: {
    afterEnterRoom() {
        setTimeout(() => {
          this.$refs.viewingRoom.scrollToBottom();
        }, 500);
    },
    async enterRoom(room) {
      // const sameRoom = this.viewingRoomId === room.roomId;
      // if (sameRoom) return;
      // await window.matrix.viewingRoom.addViewingRoom(room.roomId);
      // this.viewingRoomId = room.roomId;
      // this.hasOldTimelineTable[this.viewingRoomId] = null;
      // this.afterEnterRoom();


      const sameRoom = this.viewingRoomId === room.roomId;
      if (sameRoom) return;
      this.$refs.viewingRoom.saveOldEditMsg();
      this.$refs.viewingRoom.saveEditingMsg();
      await window.matrix.viewingRoom.addViewingRoom(room.roomId);
      this.viewingRoomId = room.roomId;
      this.hasOldTimelineTable[this.viewingRoomId] = null;
      this.afterEnterRoom();
      this.$nextTick(() => {
        this.$refs.viewingRoom.clearEditingMsg();
      });
    },
  }, 
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable', 'globalDispatchData']),
  },
  watch: {
    globalDispatchData(val) {
      // console.log('globalDispatchData changing!!');
      // console.log(val);
    }
  },
}
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

.demo-spin-icon-load{
    animation: ani-demo-spin 1s linear infinite;
}
@keyframes ani-demo-spin {
    from { transform: rotate(0deg);}
    50%  { transform: rotate(180deg);}
    to   { transform: rotate(360deg);}
}
</style>


