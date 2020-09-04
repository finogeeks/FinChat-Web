<template>
  <div class="event-item-container">
    <div
        class="event-item"
        >
        <span>
          <!-- {{getRoomManager === myinfo.userId ? '你' : `"${findUserName(getRoomManager)}"`}}已成为房间管理员 -->
          {{eve.content.msgBody}}
        </span>
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
  name: 'PowerLevelsMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
        
    };
  },
  async mounted() {
    
  },
  methods: {
    findUserName(userId) {
      return this.userList.get(userId) && this.userList.get(userId).displayName;
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
    getRoomManager() {
      let userId = '';
      Object.keys(this.eve.content.users).forEach((e) => {
        if (this.eve.content.users[e] === 100) {
          userId = e;
        }
      });
      return userId;
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
