<template>
  <div 
    class="event-item"
    :class="{'my-message': eve.sender === myinfo.userId}">
    <user-header
      :eve="eve"
      :viewingRoom="viewingRoom"></user-header>
    <div class="event-content">
      <div class="event-send-info">
        <div class="sender-name">{{ findUserName(eve) }}</div>
        <div class="send-time">{{ computeTime(eve) }}</div>
      </div>
      <div class="event-msgbody">
        <div ref="text">[暂不支持展示该消息类型]</div>
      </div>
    </div>
  </div>
</template>

<script lang="js">
import { mapState } from 'vuex';
import Header from '@/components/Header';
export default {
  name: 'UnknowMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
    };
  },
  components: {
    'user-header': Header,
  },
  async mounted() {},
  methods: {
    findUserName(eve) {
      return this.userList.get(eve.sender).displayName;
    },
    computeTime(eve) {
      if (this.$moment(new Date()).format('YYYYMMDD') > this.$moment(eve.time).format('YYYYMMDD')) {
        return this.$moment(eve.time).format('YYYY年MM月DD日 HH:mm');
      }
      return this.$moment(eve.time).format('HH:mm');
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
  },
};
</script>

<style lang="scss" scoped>

</style>
