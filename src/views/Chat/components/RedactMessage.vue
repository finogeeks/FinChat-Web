<template>
  <div class="event-item-container">
    <div
        class="event-item"
        >
        {{redactPerson}}撤回了一条消息
        <span></span>
    </div>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
import { mapState } from 'vuex';

export default {
  name: 'RedactMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
      
    };
  },
  async mounted() {
      
  },
  methods: {
    getEventAvatar(eve) {
      const members = this.viewingRoom.members;
      const member = members.find(m => m.userId === eve.sender);
      if (member && member.avatarUrl) {
        return window.matrix.user.mxcTransfer(member.avatarUrl || '');
      } else {
        return this.DEFAULT_AVATAR;
      }
    },
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
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
    action() {
      let action = '';
      switch (this.eve.content.membership) {
        case 'leave':
          action = '离开';
          break;

        case 'join':
          action = '加入';
          break;
      
        default:
          break;
      }
      return action;
    },
    redactPerson() {
      if (this.eve.sender === this.myinfo.userId) {
        return '你';
      } else {
        return this.findUserName(this.eve);
      }
    },
  },
}
</script>

<style lang="scss" scoped>

.event-item-container{
  display: flex;
  justify-content: center;
}
.event-item{
    margin-top: 10px;
    color: #ffffff;
    background: #cccccc;
    display: inline-block;
    border-radius: 3px;
    padding: 2px 5px;
}
</style>
