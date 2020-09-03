<template>
  <div class="header">
      <img :src="error ? DEFAULT_AVATAR : getEventAvatar(eve)" alt=""
        @load="hasLoaded = true"
        @error="headerOnError"
        :class="{'user-avatar': true,'loaded': hasLoaded}">
  </div>
</template>

<script lang="js">

export default {
  name: 'Header',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
      DEFAULT_AVATAR: require("../assets/images/default__avatar.png"),
      hasLoaded: false,
      error: false,
    };
  },
  async mounted() {
    
  },
  methods: {
    headerOnError() {
      this.error = true;
    },
    getEventAvatar(eve) {
      const members = this.viewingRoom.members;
      // console.log(this.viewingRoom);
      const member = members.find(m => m.userId === eve.sender);
      // console.log('member.avatarUrl');
      // console.log(member.avatarUrl);
      if (member && member.avatarUrl) {
        return window.matrix.user.mxcTransfer(member.avatarUrl || '');
      } else {
        return this.DEFAULT_AVATAR;
      }
    },
  },
  computed: {
    
  },
}
</script>

<style lang="scss" scoped>

</style>
