<template>
  <div class="ediotr-sumscope">
    <div class="editor-tools">
      <div class="tool-item" @click="handleOpenFile">
        <input type="file"
          @change="handleImageChose"
          ref="editorFiles"
          accept="image/*"
        />
        <img src="static/sp/ico_input_pic.svg">
      </div>
      <div class="tool-item" @click="handleScreenshot">
        <img src="static/sp/ico_input_screenshot.svg">
      </div>
      <div v-if="roomEntity && roomEntity.isDirect === 1" class="tool-item" @click="handleShake">
        <img src="static/sp/ico_input_shake.svg">
      </div>
    </div>
    <div v-if="ifShowAtList" class="at-list">
      <div class="at-item" 
        v-for="item in filtedAtList" :key="item.userId"
        :class="{'hover': curHoverUserId === item.userId}" 
        @mouseenter="handleAtItemHover(item)" 
        @click="handleInsertAtBlock"
      >
        {{item.qqId}}
        <div :id="`hoveredAtBlock-${roomEntity.roomId && roomEntity.roomId.replace(/!|:|\./g, '')}`" v-if="curHoverUserId === item.userId"></div>
      </div>
    </div>
    <!-- <div v-if="ifShowEmojiPicker" class="emoji-picker">

    </div> -->
    <div class="editor" 
      :id="`editor-${roomEntity.roomId && this.roomEntity.roomId.replace(/!|:|\./g, '')}`"
      :contenteditable="isQQServerWorking ? 'true' : 'false'" 
      @input="handleEditorChange"
      :placeholder="isQQServerWorking ? '请输入内容' : 'QQ服务不可用'"
    ></div>
    <Modal
      v-model="confirmFile.show"
      :title="confirmFile.title"
      :closable="false"
      :mask-closable="false"
      :transfer="true"
      class-name="file-confirm-modal"
    >
      <div v-if="confirmFile.isImage" class="file-confirm-content">
        <img :src="confirmFile.url" class="image">
        <!-- <div class="filename">{{ confirmFile.name }}</div> -->
      </div>
      <div v-else-if="confirmFile.isVideo" class="file-confirm-content">
        <img :src="confirmFile.url" class="image">
        <!-- <div class="filename">{{ confirmFile.name }}</div> -->
        <img :src="icons.videoPop" class="icon">
      </div>
      <div v-else class="file-confirm-content">
        <div class="file-icon-wrapper"><img :src="confirmFile.icon" class="file-icon"></div>
        <div class="filename">{{ confirmFile.name }}</div>
        <div class="size">{{confirmFile.size}}</div>
      </div>
      <div slot="footer">
        <Button
          type="default"
          size="small"
          class="action"
          @click="() => handleFileConfirmClick(false)">
          取消
        </Button>
        <Button
          type="primary"
          size="small"
          class="action"
          @click="() => handleFileConfirmClick(true)">
          发送
        </Button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { Modal } from 'iview';
import eventBridge from '@/utils/event-bridge';
import emojione from 'emojione';
import editorMixin from './editor.mixin';

export default {
  name: 'ediotr-qq',
  components: {
    Modal,
  },
  mixins: [editorMixin],
  props: {
    roomEntity: {
      type: Object,
      required: true,
      default: {
        roomId: '',
      },
    },
    members: {
      type: Array,
      required: true,
      default: [],
    },
  },
  data() {
    return {
      // 这个字段用作抢焦点用
      // 发送消息一秒钟内窗口失去了焦点，fc要抢回焦点
      // 丢失焦点会造成QQ服务有问题
      sendingMsgCount: 0,
      isQQServerWorking: false,
    };
  },
  methods: {
    handleInsertAtBlock() {
      const qqId = this.members.find(m => m.userId === this.curHoverUserId).qqId;
      const innerHtml = `<label data-user-id="${this.curHoverUserId}" style="color: #f9c152" contenteditable="false">@${qqId}</label>`;
      this.insertAtBlock(innerHtml);
    },
    handleShake() {
      if (!this.isQQServerWorking) {
        this.$Message.error('QQ服务不可用');
        return;
      }
      eventBridge.emit('QBRIDGE.SEND_TO_QQ.SHAKE', {
        toQQ: this.roomEntity.qqId,
        chatType: this.roomEntity.isDirect ? 1 : 2,
      });
    },
    handleWindowBlur(windowId) {
      // console.log('handleWindowBlur', this.isCursorInEditor(), windowId, this.sendingMsgCount);
      if (windowId === 'home' && this.sendingMsgCount > 0) {
        window.finstation.setFocus();
      }
    },
    handleImageChose() {
      Array.from(this.$refs.editorFiles.files).forEach((file) => {
        // console.log('handleImageChose', file);
        // eventBridge.proxy.sendImgByPath(this.roomEntity.roomId, file.path);
        this.sendImgToQQByPath(file.path);
      });
      setTimeout(() => {
        this.$refs.editorFiles.value = '';
      }, 1000);
    },
    sendImgToQQByPath(path) {
      eventBridge.emit('QBRIDGE.SEND_TO_QQ.IMAGE', {
        toQQ: this.roomEntity.qqId,
        filePath: path,
        chatType: this.roomEntity.isDirect ? 1 : 2,
      });
    },
    sendTextMessage() {
      if (!this.roomEntity.qqId) {
        this.editorContent = '';
        return;
      }
      if (!this.isCursorInEditor()) return;
      const msgBody = this.parseContent();
      if (!msgBody.body) return;
      msgBody.body = emojione.toShort(msgBody.body);
      // eventBridge.proxy.sendQQMessage(this.roomEntity.roomId, msgBody);
      const atQQs = [];
      msgBody.idlist && msgBody.idlist.forEach(item => atQQs.push(this.fqid2qqid(item)));
      if (msgBody.msgtype === 'm.text') {
        eventBridge.proxy.addQQPendingTextMsg(this.roomEntity.roomId, msgBody);
      }
      eventBridge.emit('QBRIDGE.SEND_TO_QQ.TEXT', {
        toQQ: this.roomEntity.qqId,
        strMsg: msgBody.body,
        chatType: this.roomEntity.isDirect ? 1 : 2,
        atQQs,
      });
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      editorNode.innerText = '';
      this.focus();
      this.sendingMsgCount += 1;
      setTimeout(() => {
        this.sendingMsgCount -= 1;
      }, 1000);
    },
    handleSendFile(fileBlob) {
      // const fileInfo = await this.blob2FileInfo(fileBlob);
      this.sendImgToQQByPath(fileBlob.path);
      setTimeout(() => {
        this.$refs.editorFiles.value = '';
      }, 1000);
    },
    async initQQserverStatus() {
      const QQServerStatus = await eventBridge.proxy.getQQserverStatus();
      // console.log('initQQserverStatus', QQServerStatus);
      QQServerStatus === 0 ? this.isQQServerWorking = true : this.isQQServerWorking = false;
    },
    handleQQserverStatus(isQQServerWorking) {
      this.isQQServerWorking = isQQServerWorking;
    },

    fqid2qqid(fqid) {
      if (!fqid) return;
      const matched = fqid.match(/\d+/);
      if (matched && matched[0] && matched[0].length > 5) {
        return matched[0];
      }
    },
  },
  computed: {
    // filterdAtlist
    filtedAtList() {
      // TODO 增加拼音支持
      return this.members.filter(item => (item.qqId.indexOf(this.atFilter) > -1) && !item.qqId.startsWith('10000'));
      // return this.members;
    },
  },

  created() {
    eventBridge.on('WINDOW_NATIVE_BLUR', this.handleWindowBlur.bind(this));
    eventBridge.on('QBRIDGE.READY', this.initQQserverStatus.bind(this));
    eventBridge.on('QBRIDGE.SERVER_ERROR', this.handleQQserverStatus.bind(this, false));
    eventBridge.on('QBRIDGE.SERVER_WORKING', this.handleQQserverStatus.bind(this, true));
    this.initQQserverStatus();
  },

  mounted() {

  },
  beforeDestroy() {

  },

  beforeUpdate() {

  },


};
</script>

<style lang="scss" scoped>
  @import './editor-sumscope.scss';
</style>