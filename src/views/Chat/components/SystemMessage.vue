<template>
  <div 
    v-if="eve.content.msgBody"
    class="event-item-container">
    <div class="event-item">
      <span>{{ eve.content.msgBody }}</span>
    </div>
  </div>
</template>
<script lang="js">

export default {
  name: 'SystemMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {};
  },
  methods: {
  },
};
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