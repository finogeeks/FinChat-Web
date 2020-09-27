<template>
  <div class="message">
    <text-msg
        v-if="eve.content.msgtype === 'm.text'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></text-msg>
    <image-msg
        v-else-if="eve.content.msgtype === 'm.image'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        @imgOnloaded="imgOnloaded"
        :key="eve.eventId"
        ></image-msg>
    <video-msg
        v-else-if="eve.content.msgtype === 'm.video'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></video-msg>
    <audio-msg
        v-else-if="eve.content.msgtype === 'm.audio'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></audio-msg>
    <member-ship
        v-else-if="eve.type === 'm.room.member'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></member-ship>
    <system-message
      :eve="eve"
      :viewingRoom="viewingRoom"
      :key="eve.eventId"
      v-else-if="eve.type === Message.types.roomHistoryVisibility || eve.type === Message.types.topic"
    ></system-message>
    <!--  || (eve.type === Message.types.roomHistoryVisibility && eve.content.msgBody) -->
    <room-name
        v-else-if="eve.type === 'm.room.name'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></room-name>
    <redact-msg
        v-else-if="eve.type === 'm.room.redaction'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></redact-msg>
    <power-levels
        v-else-if="eve.type === 'm.room.power_levels' && eve.content.msgBody"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></power-levels>
    <locate-msg
        v-else-if="eve.content.msgtype === 'm.location'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></locate-msg>
    <unknow-file-message
        v-else-if="eve.content.msgtype === 'm.file'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></unknow-file-message>
    <alert-msg
        v-else-if="eve.content.msgtype === 'm.alert'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></alert-msg>
    <archive-msg
        v-else-if="eve.type === 'm.room.archive'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></archive-msg>
    <mobile-call
        v-else-if="eve.type === 'm.call.hangup'"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></mobile-call>
      <!-- Message.types.eventEncrypted -->
    <encrypted-msg
        v-else-if="eve.content.msgType === Message.types.eventEncrypted || eve.content.msgType === Message.types.badEncrypted"
        :eve="eve"
        :viewingRoom="viewingRoom"
        :key="eve.eventId"
        ></encrypted-msg>
    <unknow-msg
      v-else
      :eve="eve"
      :viewingRoom="viewingRoom"
      :key="eve.eventId"
      ></unknow-msg>
  </div>
</template>

<script lang="js">
import { Message } from '@finogeeks/finchat-model';
import { mapState } from 'vuex';
import VideoMessage from './VideoMessage';
import AudioMessage from './AudioMessage';
import ImageMessage from './ImageMessage';
import TextMessage from './TextMessage';
import MemberShipMessage from './MemberShipMessage';
import RedactMessage from './RedactMessage';
import RoomRenameMessage from './RoomRenameMessage';
import PowerLevelsMessage from './PowerLevelsMessage';
import LocationMessage from './LocationMessage';
import FileMessage from './FileMessage';
import AlertMessage from './AlertMessage';
import ArchiveMessage from './ArchiveMessage';
import MobileCall from './MobileCall';
import Encrypted from './Encrypted';
import SystemMessage from './SystemMessage';
import Unknow from './UnknowMessage';

export default {
  name: 'Message',
  props: ['eve', 'viewingRoom'],
  components: {
    'video-msg': VideoMessage,
    'audio-msg': AudioMessage,
    'image-msg': ImageMessage,
    'text-msg': TextMessage,
    'member-ship': MemberShipMessage,
    'redact-msg': RedactMessage,
    'room-name': RoomRenameMessage,
    'power-levels': PowerLevelsMessage,
    'locate-msg': LocationMessage,
    'unknow-file-message': FileMessage,
    'alert-msg': AlertMessage,
    'archive-msg': ArchiveMessage,
    'mobile-call': MobileCall,
    'encrypted-msg': Encrypted,
    'system-message': SystemMessage,
    'unknow-msg': Unknow,
  },
  data() {
    return {
      DEFAULT_AVATAR: require('../../../assets/images/default__avatar.png'),
      Message,
    };
  },
  async mounted() {
    // console.log(this.eve, this.Message.types.eventEncrypted);
  },
  methods: {
    getEventAvatar(eve) {
      const members = this.viewingRoom.members;
      const member = members.find(m => m.userId === eve.sender);
      if (member && member.avatarUrl) {
        return window.matrix.user.mxcTransfer(member.avatarUrl || '');
      }
      return this.DEFAULT_AVATAR;
    },
    findUserName(eve) {
      return this.userList.get(eve.sender).displayName;
    },
    computeTime(eve) {
      if (this.$moment(new Date()).format('YYYYMMDD') > this.$moment(eve.time).format('YYYYMMDD')) {
        return this.$moment(eve.time).format('YYYY年MM月DD日 HH:mm');
      }
      return this.$moment(eve.time).format('HH:mm');
    },
    imgOnloaded() {
      // console.log('imgonloaded');
      this.$emit('imgOnloaded');
      // return true;
    },
  },
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable']),
  },
};
</script>

<style lang="scss">
.event-item{
    max-width: 100%;
    word-break: break-all;
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
          display: inline-block;
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
        white-space: pre-wrap;
        font-size:14px;
    }
    }
}
.ff{
  .event-item{
    margin-bottom: 10px;
  }
}
</style>
