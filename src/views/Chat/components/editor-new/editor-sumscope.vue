<template>
  <div class="ediotr-sumscope" @click.right="handleContextMenu">
    <div class="editor-tools">
      <div class="tool-item" @click="handleOpenEmoji">
        <img src="static/sp/ico_input_emoji.svg">
      </div>
      <div class="tool-item" @click="handleOpenFile">
        <input type="file"
          multiple="true"
          @change="handleFileChose"
          ref="editorFiles"
        />
        <img src="static/sp/ico_input_file.svg">
      </div>
      <div class="tool-item" @click="handleScreenshot">
        <img src="static/sp/ico_input_screenshot.svg">
      </div>
      <div v-if="enableChatRecord" class="tool-item" @click="handleOpenChatRecord">
        <img src="static/sp/ico_input_history.svg">
      </div>
    </div>
    <div v-if="ifShowAtList" class="at-list">
      <div class="at-item" 
        v-for="item in filtedAtList" :key="item.userId"
        :class="{'hover': curHoverUserId === item.userId}" 
        @mouseenter="handleAtItemHover(item)" 
        @click="handleInsertAtBlock"
      >
        <img class="avatar" :src="item.avatarUrl || 'static/sp/global_default_avatar.svg'"/>
        {{item.name}}
        <div :id="`hoveredAtBlock-${roomEntity.roomId && roomEntity.roomId.replace(/!|:|\./g, '')}`" v-if="curHoverUserId === item.userId"></div>
      </div>
    </div>
    <epicker 
      :id="`epicker-${roomEntity.roomId && this.roomEntity.roomId.replace(/!|:|\./g, '')}`"
      ref="epicker"
      v-if="ifShowEmojiPicker" 
      :emojiPickerDir="emojiPickerDir"
      @insertEmoji="insertEmoji" 
      @close="handleCloseEmoji"
    >
    </epicker>
    <div class="editor" 
      :id="`editor-${roomEntity.roomId && this.roomEntity.roomId.replace(/!|:|\./g, '')}`"
      :contenteditable="roomEntity && roomEntity.isBan ? 'false' : 'true'" 
      @input="handleEditorChange"
      :placeholder="roomEntity && roomEntity.isBan ? '房间已禁言' : '请输入内容'"
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
import EmojiPicker from './emoji-picker';
import editorMixin from './editor.mixin';

export default {
  name: 'ediotr',
  components: {
    epicker: EmojiPicker,
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
    emojiPickerDir: {
      type: String,
      default: 'up',
    },
    myId: {
      type: String,
      default: '',
    },
  },
  data() {
    return {

    };
  },
  methods: {
    handleInsertAtBlock() {
      let name;
      if (this.curHoverUserId === '@all') {
        name = '所有人';
      } else {
        name = this.members.find(m => m.userId === this.curHoverUserId).name;
      }
      const innerHtml = `<label data-user-id="${this.curHoverUserId}" style="color: #f9c152" contenteditable="false">@${name}</label>`;
      this.insertAtBlock(innerHtml);
    },
    async handleFileChose() {
      // console.log('handleFileChose', this.$refs.editorFiles.files);
      // this.handleOtherFileModel(this.$refs.editorFiles.files[0]);
      this.handleUpload(this.$refs.editorFiles.files);
      // const fileInfo = await this.blob2FileInfo(this.$refs.editorFiles.files[0]);
      // eventBridge.proxy.sendFile(this.roomEntity.roomId, fileInfo);
      // setTimeout(() => {
      //   this.$refs.editorFiles.value = '';
      // }, 1000);
    },
    async handleSendFile(fileBlob) {
      const fileInfo = await this.blob2FileInfo(fileBlob);
      eventBridge.proxy.sendFile(this.roomEntity.roomId, fileInfo);
      setTimeout(() => {
        this.$refs.editorFiles.value = '';
      }, 1000);
    },
    sendTextMessage() {
      if (!this.isCursorInEditor()) return;
      const msgBody = this.parseContent();
      // console.log('sendTextMessage', msgBody);
      if (!msgBody.body) return;
      eventBridge.proxy.sendMessage(this.roomEntity.roomId, msgBody);
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      editorNode.innerText = '';
      this.focus();
    },
  },
  computed: {
    // filterdAtlist
    filtedAtList() {
      // TODO 增加拼音支持
      const atList = [...this.members];
      atList.unshift({
        avatarUrl: 'static/assets/room_avatar_all.svg',
        displayName: '所有人',
        name: '所有人',
        rawDisplayName: '所有人',
        userId: '@all',
      });
      return atList.filter(item => ((item.name.indexOf(this.atFilter) > -1) && item.userId !== this.myId && item.membership === 'join') || item.userId === '@all');
      // return this.members;
    },
  },

  created() {

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