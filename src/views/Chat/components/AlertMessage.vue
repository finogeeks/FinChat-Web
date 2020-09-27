<template>
  <div
      class="event-item"
      :class="{'my-message': eve.sender === myinfo.userId}"
      >
      <user-header
        :eve="eve"
        :viewingRoom="viewingRoom"
        ></user-header>
      <div class="event-content">
          <div class="event-send-info">
          <div class="sender-name">
              {{findUserName(eve)}}
          </div>
          <div class="send-time">
              {{computeTime(eve)}}
          </div>
          </div>
          <div class="event-msgbody">
            <!-- {{eve.content.body}} -->
            <div ref="text" v-html="sanitizedText()"></div>
          </div>
      </div>
  </div>
</template>

<script lang="js">
import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import { cloneDeep } from 'lodash';
import { mapState } from 'vuex';
import emojione from 'emojione';
import Header from '@/components/Header';

export default {
  name: 'AlertMessage',
  props: ['eve', 'viewingRoom'],
  data() {
    return {
      DEFAULT_AVATAR: require('../../../assets/images/default__avatar.png'),
      hasLoaded: false,
    };
  },
  components: {
    'user-header': Header,
  },
  async mounted() {
    // console.log(this.eve);
  },
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
    sanitizedText() {
      const regExp = /(https?:\/\/|finchat:\/\/|www\.)[-a-zA-Z0-9@:;%_+.~#?!&./=]{2,1024}/gi;
      const hasUrl = text => text.match(regExp);
      // console.log(hasUrl(this.eve.content.body));
      const renderedText = hasUrl(this.eve.content.body) ? this.highlightUrl(regExp) : this.eve.content.body;
      // console.log(renderedText);
      return emojione.unicodeToImage(renderedText);
    },
    highlightUrl(regExp) {
      return this.eve.content.body.replace(regExp, (match) => {
        let url = match;
        if (!url.startsWith('http') && !url.startsWith('finchat')) {
          url = `https://${url}`;
        }
        return `<a href="${url}" target="_blank" class="message-url" style="color:#4285F4;cursor:pointer;word-break:break-all;text-decoration:underline">${match}</a>`;
      });
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
  },
};
</script>

<style lang="scss" scoped>

.event-item{
    display: flex;
    margin-top: 10px;
    &.my-message{
    flex-direction: row-reverse;
    .event-content{
        padding-left: 0;
        padding-right: 8px;
        display: flex;
        flex-direction: column;
        .event-send-info{
        flex-direction: row-reverse;
        .sender-name{
            margin-right: 0;
            display: none;
        }
        .send-time{
            
        }
        }
        .event-msgbody{
        background-color: #cde6ff;
        align-self: flex-end;
        }
    }
    }
    .header{
      img{
          width: 30px;
          height: 30px;
          border-radius: 3px;
      }
      .user-avatar{
        opacity: 0;
        &.loaded{
          opacity: 1;
        }
      }
    }
    .event-content{
    padding-left: 8px;
    .event-send-info{
        display: flex;
        font-family: HelveticaNeue;
        font-size: 12px;
        font-weight: normal;
        font-stretch: normal;
        line-height: 14px;
        letter-spacing: 0px;
        color: #999999;
        .sender-name{
        margin-right: 18px;
        }
        .send-time{

        }
    }
    .event-msgbody{
        background-color: #ffffff;
        border-radius: 4px;
        padding: 8px 10px;
        margin-top: 6px;
        display: inline-block;
        word-break: break-all;
    }
    }
}
</style>
