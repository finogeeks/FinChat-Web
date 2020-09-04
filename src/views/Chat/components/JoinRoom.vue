<template>
  <div class="join-room">
    <div class="room-avatar">
      <img class="avatar-img" src="@/assets/images/channel_default.png" alt="">
    </div>
    <div class="room-name">
      {{roomInfo.name}}
    </div>
    <div v-if="canJoin" class="join-btn" @click="joinRoom">
      加入该频道
    </div>
    <div v-else class="cant-join-btn">
      加入该频道
    </div>
  </div>
</template>

<script lang="js">
import { mapState } from 'vuex';
import { IAM_INFO_KEY, BASE_URL, WEB_NAME } from '@/commonVariable';
import IAM from '@/model/iam';
import emitter from '@/utils/event-emitter';
import axios from 'axios';

const Matrix = window.matrix;

export default {
  components: {
      
  },
  props: [],
  data() {
    return {
      roomInfo: {},
      canJoin: true,
    };
  },
  async mounted() {
    if (this.chatRoom) {
      // console.log('axios');
      // console.log(axios);
      const roomInfo = await IAM.getChannelDetail(this.chatRoom);
      // console.log('INDEX MOUNTED');
      // console.log(roomInfo.data);
      this.roomInfo = roomInfo.data
    }
    // let joinflag = false;
    const rollRoom = () => {
      const intrval = setInterval(() => {
        const room = this.$store.state.roomList.find(e => e.roomId === this.chatRoom);
        if (room && room.membership !== 'leave') {
          clearInterval(intrval);
          this.enterRoom(room);
          emitter.removeListener('ROOM_UPDATE', enterRoom);
        }
      }, 500);
    }
    const enterRoom = async (newRoom) => {
      if (newRoom.roomId !== this.chatRoom) return;
      if (this.viewingRoomId === this.chatRoom) return;
      rollRoom();
      // // if (joinflag) return;
      // // joinflag = true;
      // // console.log('INDEX ROOM_UPDATE: ', this.viewingRoomId, this.chatRoom);
      // setTimeout(async () => {
      //   const room = this.$store.state.roomList.find(e => e.roomId === this.chatRoom);
      //   // console.log('JOINROOM ROOM_UPDATE');
      //   // console.log(room);
      //   this.enterRoom(room);
      // }, 0);
      // emitter.removeListener('ROOM_UPDATE', enterRoom);
    };
    emitter.addListener('ROOM_UPDATE', enterRoom);
    emitter.addListener('ROOMS_INIT', () => {
      setTimeout(() => {
        this.canJoin = true;
      }, 0);
    });
  },
  methods: {
    async joinRoom() {
      this.canJoin = false;
      // let 
      const room = this.$store.state.roomList.find(e => e.roomId === this.chatRoom);
      // console.log(room);
      if (!room) {
        try {
          if (this.roomInfo.preset === 'public_chat') {
            await IAM.joinRoom(this.chatRoom);
          } else if (this.roomInfo.preset === 'private_chat') {
            await IAM.inviteAndJoin(this.chatRoom, this.roomInfo.creator);
          } else {
            await IAM.joinRoom(this.chatRoom);
          }
        } catch(e) {
          this.$Message.error({
              background: true,
              content: '无法加入该频道'
          });
        }
        // const joinroom = await IAM.joinRoom(this.chatRoom);
        // // console.log('IAM.joinRoom(this.chatRoom)');
        // // console.log(joinroom, joinroom.data.errcode);
        // if (joinroom.data.errcode === 'M_UNKNOWN_TOKEN') {
        //   this.$Message.error({
        //       background: true,
        //       content: '无法加入该频道'
        //   });
        // }
        return;
      }
      // console.log('INDEX MOUNTED');
      // console.log(room);
      this.enterRoom(room);
    },
    enterRoom(room) {
      this.$emit('hideLingRoom');
      this.$emit('enterRoom', room);
    },
  }, 
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable', 'chatRoom']),
    roomList() {
      if (this.isConsultMode) {
        return this.$store.state.roomList.filter(e => e.roomType !== 'DISPATCH');
      } else {
        return this.$store.state.roomList;
      }
    },
    hasUnread() {
      return this.roomList.reduce((totle, room) => {
        return totle + room.unread;
      }, 0);
    },
    viewingRoom() {
      return this.roomList.find(room => room.roomId === this.viewingRoomId) || {};
    },
  },
  watch: {
    
  },
}
</script>

<style lang="scss" scoped>
.join-room{
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  .room-avatar{
    margin-top: 20%;
    .avatar-img{
      width: 100px;
    }
  }
  .room-name{
    margin-top: 20px;
    font-size: 16px;
  }
  .join-btn{
    margin-top: 30px;
    font-size: 16px;
    background-color: #4285f4;
    color: #ffffff;
    padding: 7px 40px;
    border-radius: 5px;
    cursor: pointer;
  }
  .cant-join-btn{
    margin-top: 30px;
    font-size: 16px;
    background-color: #969696;
    color: #ffffff;
    padding: 7px 40px;
    border-radius: 5px;
  }
}
</style>

