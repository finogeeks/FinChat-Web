<template>
  <div class="ediotr-new">
    <div class="editor-tools">
      <div class="tool-item" @click="handleOpenEmoji">
        <img src="static/assets/input_emoji_default.svg">
      </div>
      <div class="tool-item" @click="handleOpenFile">
        <input type="file"
          @change="handleFileChose"
          ref="editorFiles"
        />
        <img src="static/assets/input_file_default.svg">
      </div>
      <!-- <div class="tool-item" @click="handleScreenshot">
        <img src="static/assets/input_screenshot_default.svg">
      </div> -->
      <!-- <div v-if="enableChatRecord" class="tool-item" @click="handleOpenChatRecord">
        <img src="static/assets/input_RECORD_default.svg">
      </div> -->
    </div>
    <div v-if="ifShowAtList" class="at-list">
      <div class="at-item" 
        v-for="item in filtedAtList" :key="item.userId"
        :class="{'hover': curHoverUserId === item.userId}"
        @mouseenter="handleAtItemHover(item)" 
        @click="handleAtItemClick($event)"
        >
        <img 
          style="
            width: 30px;
            height: 30px;
            vertical-align: middle;
            border-radius: 15px;
            margin-right: 10px;
            display: inline-block;
          "
          :src="item.imgerror ? DEFAULT_AVATAR : (item.avatarUrl || DEFAULT_AVATAR)" alt=""
          @error="imgOnError(item)"
          >
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
      :style="{ flex: '1 0 '+editorHeight+'px' }"
      :class="{'editor-draging': editorDraging}"
      ref="editor"
      :id="`editor-${roomEntity.roomId && this.roomEntity.roomId.replace(/!|:|\./g, '')}`"
      :contenteditable="roomEntity && roomEntity.isBan ? 'false' : 'true'" 
      @compositionstart="compositionstart"
      @compositionend="compositionend"
      @input="handleEditorChange"
      :placeholder="roomEntity && roomEntity.isBan ? '房间已禁言' : '请输入内容'"
    ></div>
    <Modal
      v-model="confirmFile.show"
      :title="confirmFile.title"
      :closable="false"
      :mask-closable="false"
      :transfer="false"
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
        <img :src="confirmFile.icon" class="file-icon">
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
import eventBridge from '@/utils/event-bridge';
import EmojiPicker from './emoji-picker';
import editorMixin from './editor.mixin';
import { agentJudge } from '@/utils.js';
import { mapState } from 'vuex';

export default {
  name: 'ediotr',
  components: {
    epicker: EmojiPicker,
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
      default: () => {
        return [];
      },
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
      focuseNode: null,
      canSend: true,
      DEFAULT_AVATAR: require("@/assets/images/default__avatar.png"),
      agentJudge,
    };
  },
  methods: {
    imgOnError(item) {
      item.imgerror = true;
    },
    compositionstart(e) {
      console.log('compositionstart');
      this.canSend = false;
      console.log(this.canSend);
    },
    compositionend(e) {
      console.log('compositionend');
      if (agentJudge === 'Safari') {
        setTimeout(() => {
          this.canSend = true;
          console.log(this.canSend);
        },150)
      } else {
        this.canSend = true;
        console.log(this.canSend);
      }
    },
    mxcTransfer(member) {
      return window.matrix.user.mxcTransfer(member.avatarUrl || '');
    },
    handleAtItemClick(e) {
      // console.log('handleAtItemClick');
      e.preventDefault();
      e.stopPropagation();
      // const curInx = this.filtedAtList.findIndex(item => item.userId === this.curHoverUserId);
      // if (curInx > 0) {
      //   this.curHoverUserId = this.filtedAtList[curInx - 1].userId;
      //   document.getElementById(`hoveredAtBlock-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`).scrollIntoView(false);
      // }
      // console.log(this.$refs.editor.childNodes);
      this.$refs.editor.focus();
      // this.$refs.editor.children[this.$refs.editor.children.length - 2].focus();
      // const select = window.getSelection();
      // console.log(select);
      // this.$refs.editor.collapse(this.$refs.editor.childElementCount);
      // select.collapseToEnd();
      // console.log(this.$refs.editor.lastChild);
      // var range = this.$refs.editor.children[this.$refs.editor.children.length - 2].createTextRange();  // 创建文本区域对象

      // range.moveEnd("character",2);  
      // select.collapse(this.$refs.editor, 2);
      // this.$nextTick(() => {
      const range = document.createRange();
      const referenceNode = this.focuseNode;
      console.log(this.focuseNode);
      range.selectNodeContents(referenceNode);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      this.handleInsertAtBlock();
      // });
    },
    handleInsertAtBlock() {
      const name = this.filtedAtList.find(m => m.userId === this.curHoverUserId).name;
      const innerHtml = `<label data-user-id="${this.curHoverUserId}" style="color: #4285f4" contenteditable="false">@${name}</label>`;
      this.insertAtBlock(innerHtml);
    },
    async handleFileChose() {
      // this.handleOtherFileModel(this.$refs.editorFiles.files[0]);
      this.handleUpload(this.$refs.editorFiles.files);
      // const fileInfo = await this.blob2FileInfo(this.$refs.editorFiles.files[0]);
      // eventBridge.proxy.sendFile(this.roomEntity.roomId, fileInfo);
      setTimeout(() => {
        this.$refs.editorFiles.value = '';
      }, 1000);
    },
    async handleSendFile(fileBlob) {
      // console.log('handleSendFile', fileBlob);
      const fileInfo = await this.blob2FileInfo(fileBlob);
      eventBridge.proxy.sendFile(this.roomEntity.roomId, fileInfo);
      setTimeout(() => {
        this.$refs.editorFiles.value = '';
      }, 1000);
    },
    async sendTextMessage() {
      if (!this.isCursorInEditor()) return;
      const msgBody = this.parseContent();
      if (!msgBody.body) return;
      // eventBridge.proxy.sendMessage(this.roomEntity.roomId, msgBody);
      const response = await window.matrix.mxClient.sendMessage(this.roomEntity.roomId, msgBody);
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      editorNode.innerText = '';
      this.focus();
    },
    replaceText(innerHTML) {
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      editorNode.innerHTML = innerHTML;
      const range = document.createRange();
      const childNodes = editorNode.childNodes;
      const lastChild = childNodes.length > 0 ? childNodes[childNodes.length - 1] : editorNode;
      // 获取当前选中区域
      range.selectNodeContents(lastChild);
      range.collapse(false);
      const sel = window.getSelection();
      // 鼠标移动到最后一位
      sel.removeAllRanges();
      sel.addRange(range);
      if (innerHTML.slice(-1) === '@') {
        this.showAtList();
        const selection = window.getSelection();
        const focusNode = selection.focusNode;
        this.focuseNode = focusNode;
      }
    },
  },
  computed: {
    ...mapState(['editorHeight', 'editorDraging']),
    // filterdAtlist
    filtedAtList() {
      // console.log('this.atFilter', this.atFilter);
      // TODO 增加拼音支持
      const atList = [...this.members];
      const res = atList.filter(item => {
        item.avatarUrl = item.avatarUrl ? this.mxcTransfer(item) : '';
        return ((item.name.indexOf(this.atFilter || '') > -1) && item.userId !== this.myId && item.membership === 'join') || item.userId === '@all';
      });
      res.unshift({
        avatarUrl: 'static/assets/room_avatar_all.svg',
        displayName: '所有人',
        name: '所有人',
        rawDisplayName: '所有人',
        userId: '@all',
      });
      return res;
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

  watch: {
    'roomEntity.roomId'(val) {
      // console.log('roomEntity.roomId', val);
      // this.ifShowAtList = false;
      this.closeAtList();
    },
  }
};
</script>

<style lang="scss" scoped>
  @import './editor.scss';
</style>

<style lang="scss">
  .emojione{
    width: 18px;
    display: inline-block;
    vertical-align: top;
  }
</style>