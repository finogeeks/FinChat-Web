<template>
    <div
      v-show="!!viewingRoomId" 
      class="chat-room" 
      :class="{'full-screen': !showRoomList}" 
      :style="{ height: windowHeight+'px', width: (windowWidth-roomListWidth)+'px' }"
      >
        <div class="room-title">
            <div class="room-title-name">
                {{viewingRoom.name}}
            </div>
            <!-- <button @click="joinRoomTest">join room</button> -->
            <div class="room-tools" v-if="viewingRoom.isChannel">
                <Icon type="md-settings" style="cursor:pointer;" @click="produceUrl"/>
            </div>
        </div>
        <div v-if="agentJudge !== 'FF'" 
          ref="records" class="timeline-list" 
          @scroll="handleScroll" 
          @mousewheel.stop="handleMousewheel" 
          :class="{'cannot-scroll': isLoading}"
          :style="{height: (windowHeight-editorHeight-40-50)+'px'}">
            <div class="go-to-up-btn" v-show="showRoomUpBtn" @click="scrollUp">
                <img src="@/assets/images/room_up.svg" alt=""
                  style="width: 10px;vertical-align: middle;margin-right: 5px;">
                <span>{{showRoomUpBtn > 99 ? '99+' : showRoomUpBtn}}条新消息</span>
            </div>
            <Spin v-if="isLoading" fix class="loading-flag">
                <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>
            </Spin>
            <timeline-message
                v-for="(eve, idx) in roomTimeLine"
                :key="idx"
                :ref="eve.eventId"
                :eve="eve"
                :viewingRoom="viewingRoom"
                @imgOnloaded="imgOnloaded"
                ></timeline-message>
            <div class="go-to-bottom-btn" v-show="showGotoBottomBtn" @click="scrollToBottom">
                <img src="@/assets/images/room_down.svg" alt=""
                  style="width: 10px;vertical-align: middle;margin-right: 5px;">
                <span v-if="viewingRoom.totlaunread > 0">{{viewingRoom.totlaunread > 99 ? '99+' : viewingRoom.totlaunread}}条新消息</span>
                <span v-else>回到底部</span>
            </div>
        </div>
        <div v-else 
          ref="records" 
          class="timeline-list ff"  
          @scroll="handleScroll" 
          @DOMMouseScroll.stop="handleMousewheel" 
          :class="{'cannot-scroll': isLoading}">
            <div class="go-to-up-btn" v-show="showRoomUpBtn" @click="scrollUp">
                <img src="@/assets/images/room_up.svg" alt=""
                  style="width: 10px;vertical-align: middle;margin-right: 5px;">
                <span>{{showRoomUpBtn > 99 ? '99+' : showRoomUpBtn}}条新消息</span>
            </div>
            <Spin v-if="isLoading" fix class="loading-flag">
                <Icon type="ios-loading" size=18 class="demo-spin-icon-load"></Icon>
            </Spin>
            <timeline-message
                v-for="(eve, idx) in roomTimeLine"
                :key="idx"
                :ref="eve.eventId"
                :eve="eve"
                :viewingRoom="viewingRoom"
                @imgOnloaded="imgOnloaded"
                ></timeline-message>
            <div class="go-to-bottom-btn" v-show="showGotoBottomBtn" @click="scrollToBottom">
                <img src="@/assets/images/room_down.svg" alt=""
                  style="width: 10px;vertical-align: middle;margin-right: 5px;">
                <span v-if="viewingRoom.totlaunread > 0">{{viewingRoom.totlaunread > 99 ? '99+' : viewingRoom.totlaunread}}条新消息</span>
                <span v-else>回到底部</span>
            </div>
        </div>
        <div class="editor-drag-drop" :style="{ bottom: (editorHeight+40-2)+'px', left: (roomListWidth-2)+'px' }" @mousedown="dragBegin"></div>
        <div class="msg-edit">
            <!-- <editor 
                ref="editor"
                class="text-editor"
                :disabled="disabledEditor"
                :disabled-message="disabledEditorMessage"
                :tools="tools"
                :suggestions="suggestions"
                :suggestion-option="suggestionOption"
                @event="handleEditorEvent"
            /> -->
            <editor
              ref="editor"
              :members="viewingRoom.members"
              :roomEntity="viewingRoom"
              :emojiPickerDir="'up'"
              :myId="myinfo.userId"
              @handleImage="handleImage"
              @handleVideo="handleVideo"
              @handleOtherFile="handleOtherFile"
              />
        </div>
        <Modal
            v-model="confirmFile.show"
            :title="confirmFile.title"
            :closable="false"
            :mask-closable="false"
            :transfer="false"
            class-name="file-confirm-modal"
            >
            <div v-if="confirmFile.isImage" class="file-confirm-content">
                <img :src="confirmFile.url"
                  :style="{'max-height': (windowHeight - 334)+'px'}"
                 class="image">
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
        <Modal v-model="roomConfig.show" width="60%">
            <p slot="header">
                <span>频道链接</span>
            </p>
            <div>
                <p style="
                  display: inline-block;
                  vertical-align: middle;
                  line-height: 32px;
                  width: calc(100% - 60px);
                ">{{roomJumpUrl}}</p>
                <Button style="
                  float: right;
                  vertical-align: middle;
                "
                @click="copyRoomJumpUrl"
                >复制</Button>
            </div>
            <div slot="footer" style="text-align: left;">
                <!-- <Button @click="roomConfig.show = false">关闭</Button> -->
                用户在Web端可以通过该链接方便地加入频道，快来分享吧！
            </div>
        </Modal>
    </div>
</template>

<script lang="js">
import { Message, Draft } from '@finogeeks/finchat-model';
import emitter from '@/utils/event-emitter';
import { mapState } from 'vuex';
import canvasUtils from '@/utils/canvas';
import { debounce as _debounce } from 'lodash';
import MessageComponent from './Message.vue';
// import Editor from './Editor.vue';
import Editor from './editor-new/editor';
import { cloneDeep } from 'lodash';
import { IAM_INFO_KEY, BASE_URL } from '@/commonVariable';
import editorMixin from './mixins/editor.mixin';
import icons, { iconTypeMatcher } from '@/utils/icon';
import { agentJudge } from '@/utils.js';
import IAM from '@/model/iam';


const Matrix = window.matrix;
const RESERVED_HEIGHT = 5;
const FOLLOW_HEIGHT = 5;
const MAX_FILESIZE = 0;
const NET_DISK_API = true;

export default {
  props: ['viewingRoomId', 'isConsultMode'],
  mixins: [editorMixin],
  components: {
    'timeline-message': MessageComponent,
    'editor': Editor,
  },
  created() {
      
  },
  data() {
    return {
    //   viewingRoomId: '',
    //   messageEditing: '',
    //   DEFAULT_AVATAR: require("../../assets/images/default__avatar.png"),
      isLoading: false,
      recordsScrollHeight: 0,
      recoresScrollTop: 0,
    //   showOperateBtn: false,
    //   showQuitModal: false,
      drafts: [],
      confirmFile: {},
      uploadQueue: [],
      timeLineFix: false,
      showGotoBottomBtn: false,
      agentJudge: agentJudge,
      oldEditingMsg: '',
      editingMsg: '',
      showRoomUpBtn: false,
      roomConfig: {
        show: false,
      },
      roomJumpUrl: '',
      mouseMoveY: 0,
      timer: null,
    };
  },
  async mounted() {
    // emitter.addListener('INIT_TIMELINE', (roomId, roomTimeLine) => {
    //   // console.log('INIT_TIMELINE');
    //   // console.log(roomId, roomTimeLine);
    //   this.$store.commit('initRoomTimeline', {roomId, roomTimeLine: cloneDeep(roomTimeLine)});
    //   this.$nextTick(()=>{
    //     this.scrollToBottom();
    //   });
    // })
    // // console.log(this.tools);
    emitter.addListener('TIMELINE_UPDATE', (message, roomId) => {
      if (roomId !== this.viewingRoomId) return;
      // console.log('VIEWING ROOM TIMELINE UPDATE');
      // console.log(this.timeLineFix);
      if (this.timeLineFix) return;
      this.$nextTick(() => {
        this.scrollToBottom({ forceRecipt: true });
      });
    });
    emitter.addListener('ROOM_UPDATE',(newRoom) => {
      if (newRoom.isArchiveChannel) this.$emit('quitRoom');
      if (newRoom.membership === 'leave') {
        // this.$Message.error({
        //     background: true,
        //     content: '您已退出房间'
        // });
        // console.log('VIEWINGROOM ROOMUPDATE QUIT');
        // console.log(newRoom);
        this.$emit('quitRoom')
      };
    });
    const myinfo = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY));
    // console.log(myinfo);
    this.$fcNetdisk.init(
      '', 
      myinfo.userId,
      myinfo.jwt,
      myinfo.access_token,
    );
  },
  methods: {
    dragBegin() {
      console.log('dragBegin');
      this.$store.commit('setEditorDraging', true);
      document.addEventListener('mousemove', this.documentMove);
      document.addEventListener('mouseup', this.dragEnd);
    },
    dragEnd() {
      console.log('dragEnd');
      this.$store.commit('setEditorDraging', false);
      document.removeEventListener('mousemove', this.documentMove);
      document.removeEventListener('mouseup', this.dragEnd);
    },
    documentMove(e) {
      // console.log('documentMove',e.movementY);
      if (e.movementY === 0) return;
      this.mouseMoveY += e.movementY;
      if (this.timer) return;
      this.timer = setTimeout(() => {
        // console.log('setTimeout=============');
        // console.log(this.editorHeight+this.mouseMoveY);
        this.$store.commit('setEditorHeight', this.editorHeight-this.mouseMoveY);
        clearTimeout(this.timer);
        this.timer = null;
        this.mouseMoveY = 0;
      }, 16)
    },
    copyRoomJumpUrl() {
      // window.clipboardData.setData('text',this.roomJumpUrl);
      // const selection = window.getSelection();
      // const range = document.createRange();
      let inputEle = document.createElement('input')
      document.body.appendChild(inputEle)
      inputEle.setAttribute('value', this.roomJumpUrl)
      inputEle.setAttribute('readonly', 'readonly')
      inputEle.select()
      document.execCommand('copy')
      document.body.removeChild(inputEle);
      this.$Message.success('复制成功！');
    },
    joinRoomTest() {
      IAM.joinRoom(this.chatRoom);
    },
    produceUrl() {
      // // console.log(this.$route);
      // // console.log(window.location);
      const baseurl = window.location.href.split('?')[0];
      const url = `${baseurl}?chatroom=${this.viewingRoom.roomId}`
      this.roomJumpUrl = url;
      this.roomConfig.show = true;
      // console.log(this.roomJumpUrl);
    },
    async computeUnread() {
      if (this.viewingRoom.unread > 9) {
        this.showRoomUpBtn = this.viewingRoom.unread;
        const message = await window.matrix.viewingRoom.getTimelineMsg(
          this.viewingRoomId, 
          this.roomTimeLine[this.roomTimeLine.length - 1].eventId, 
          'BACKWORDS', 
          this.viewingRoom.unread
        );
        this.$store.commit('loadMoreTimeline', {message, roomId: this.viewingRoomId});
      }
    },
    scrollUp() {
      const listComp = this.$refs.records;
      const scrollTop = Math.ceil(listComp.scrollTop);
      const scrollHeight = Math.ceil(listComp.scrollHeight);
      const clientHeight = Math.ceil(listComp.clientHeight);
      // console.log(scrollTop, scrollHeight, clientHeight);
      const firstUnreadMsg = this.roomTimeLine[this.roomTimeLine.length - this.showRoomUpBtn];
      // console.log(firstUnreadMsg);
      const furmd = this.$refs[firstUnreadMsg.eventId];
      // console.log(furmd[0].$el.offsetTop);
      listComp.scrollTop = furmd[0].$el.offsetTop
      this.showRoomUpBtn = false;
    },
    imgOnloaded() {
      // // console.log('imgonloaded');
      if (!this.timeLineFix) {
        this.scrollToBottom();
      }
      // return true;
    },
    scrollToBottom({ forceRecipt } = {}) {
      // // console.log('scrollToBottom',this.viewingRoom.totlaunread);
      const listComp = this.$refs.records;
      const scrollTop = Math.ceil(listComp.scrollTop);
      const scrollHeight = Math.ceil(listComp.scrollHeight);
      const clientHeight = Math.ceil(listComp.clientHeight);
      // // console.log(listComp,scrollTop,scrollHeight, clientHeight);
      listComp.scrollTop = scrollHeight - clientHeight;
      this.timeLineFix = false;
      // window.matrix.viewingRoom.setReceipt(this.viewingRoomId);
      if (this.viewingRoom.totlaunread > 0 || forceRecipt) {
        this.handleSendReceipt();
      }
    },
    clearEditingMsg() {
      if (this.$refs.editor) {
        this.$refs.editor.replaceText(this.viewingRoom.roomEditingMsg);
      }
    },
    saveEditingMsg() {
      // this.viewingRoom.roomEditingMsg = this.editingMsg;
      this.viewingRoom.roomEditingMsg = this.$refs.editor.originContent();
      this.$store.commit('updateRoomList', null);
    },
    saveOldEditMsg() {
      this.oldEditingMsg = this.$refs.editor.originContent();
    },
    async loadMore() {
      // // console.log('LOAD MORE');
      // // console.log(this.roomTimeLine);
      // await window.matrix.viewingRoom.loadMoreMessage({roomId: this.viewingRoomId});
      const message = await window.matrix.viewingRoom.getTimelineMsg(this.viewingRoomId, this.roomTimeLine[0].eventId);
      // console.log(message);
      this.$store.commit('loadMoreTimeline', {message, roomId: this.viewingRoomId});
    },
    async sendMessage({ roomId, message }, msgType) {
      // console.log('SEND MESSAGE');
      const response = await window.matrix.mxClient.sendMessage(roomId, message);
    },
    handleMousewheel() {
      // // console.log('handleMousewheel~~~~');
      const listComp = this.$refs.records;
      let { scrollTop, scrollHeight, clientHeight } = listComp;
      this.showRoomUpBtn = false;
      // // console.log(scrollTop,clientHeight,scrollHeight);
      if ( scrollHeight > (scrollTop + clientHeight) ) {
        this.timeLineFix = true;
      } else {
        this.timeLineFix = false;
      }
      if (!listComp || this.isLoading) {
        return;
      }
      scrollTop = Math.ceil(listComp.scrollTop);
      if (scrollTop < RESERVED_HEIGHT) { // 顶部
        // // console.log('LOAD MORE');
        this.handleMoreTimeline();
        return;
      }
      if ( (scrollTop + clientHeight) === scrollHeight ) {
        // window.matrix.viewingRoom.setReceipt(this.viewingRoomId);
        if (this.viewingRoom.totlaunread > 0) {
          this.handleSendReceipt();
        }
        return;
      }
      if (scrollHeight <= FOLLOW_HEIGHT) {
        // console.log(`DON'T LOAD MORE`);
        return;
      }
    },
    handleScroll() {
      // // console.log('scroll~~~~');
      const listComp = this.$refs.records;
      const { scrollTop, scrollHeight, clientHeight } = listComp;
      if ( scrollHeight > (scrollTop + clientHeight) ) {
        this.showGotoBottomBtn = true;
      } else {
        this.showGotoBottomBtn = false;
      }
    },
    handleMoreTimeline: _debounce(async function (goToBottom) { // eslint-disable-line
      // console.log(this.isLoading);
      if (this.isLoading || this.hasOldTimelineTable[this.viewingRoomId]) {
        return;
      }
      // // console.log('LOAD MORE');
      this.isLoading = true;
      this.recordsScrollHeight = this.$refs.records.scrollHeight;
      // this.recoresScrollTop = this.$refs.records.scrollTop;
      this.$refs.records.scrollTop = 0;
      // console.log('===========this.recordsScrollHeight===========');
      // console.log(this.recordsScrollHeight);
      const message = await window.matrix.viewingRoom.getTimelineMsg(this.viewingRoomId, this.roomTimeLine[0].eventId);
      // console.log(message);
      if (message.length === 0) {
        this.$store.commit('setOldTimelineTable', { roomId: this.viewingRoomId, hasOldTimeline: true })
        this.isLoading = false;
        return;
      }
      this.$store.commit('loadMoreTimeline', {message, roomId: this.viewingRoomId});
      this.$nextTick(() => {
        this.$refs.records.scrollTop = this.$refs.records.scrollHeight - this.recordsScrollHeight - 20;
      });
      this.isLoading = false;
    }, 500, { leading: true, trailing: false }),
    handleSendReceipt: _debounce(async function () { // eslint-disable-line
      // // console.log('滚动到底部啦~~~');
      window.matrix.viewingRoom.setReceipt(this.viewingRoomId);
    }, 500, { leading: true, trailing: false }),
    async handleSend(payload) {
      // console.log('handleSend');
      let message = '';
      const rawText = payload.text;
      const mentions = payload.mentions;
      const block = payload.block;
      const text = (rawText && rawText.trim()) || '';
      if (!text) {
        return;
      }
      if (mentions.length) {
        if (this.hasSignal) {
          message = this.buildSignalMessage(rawText, block);
        } else {
          message = this.buildAlertMessage(rawText, mentions);
        }
      } else {
        message = this.buildTextMessage(text);
      }
      if (message) {
        this.lastSendMessage = message;
        this.clearDraft(this.viewingRoomId);
        // const room = this.$matrix.getRoomInfo(this.meta.id);
        // if (room.isServiceRoom) {
        //   const orderId = room.serviceInfo.orderId;
        //   message.order_id = orderId;
        // }
        await this.sendMessage({ roomId: this.viewingRoomId, message }, Message.types.text);
      }
      // this.$refs['chat-records'].handleLatest();
    },
    buildSignalMessage(rawText = '', meta = undefined, appendSignals = []) {
      if (!rawText) {
        return null;
      }
      let displayText = '';
      const signals = [];
      const idlist = [];
      if (typeof meta === 'object') {
        const entityIndex = [];
        const entityMap = meta.entityMap;
        Object.keys(entityMap).forEach((key) => {
          const entity = entityMap[key];
          if (entity.type === 'mention') {
            entityIndex.push(key);
          }
        });

        let blockStartIndex = 0;
        meta.blocks.forEach((block, index) => {
          let rawBlockTextArray = [];
          if (index === 0) {
            rawBlockTextArray = lodash.toArray(block.text);
          } else {
            rawBlockTextArray = ['\n'].concat(lodash.toArray(block.text));
          }
          displayText += rawBlockTextArray.join('');
          block.entityRanges.forEach((range) => {
            const mention = entityMap[range.key].data.mention;
            if (!mention) {
              return;
            }
            const startIndex = blockStartIndex + range.offset + (index === 0 ? 0 : 1);
            const endIndex = startIndex + range.length;
            if (mention.trigger === '@') {
              signals.push({
                type: mention.trigger,
                val: mention.id,
                start: startIndex,
                end: endIndex,
              });
              idlist.push(mention.id);
            } else {
              signals.push({
                type: mention.trigger,
                val: mention.name,
                start: startIndex,
                end: endIndex,
              });
            }
          });
          blockStartIndex += rawBlockTextArray.length;
        });
      } else {
        displayText = lodash.toArray(rawText).join('');
      }

      const message = {
        msgtype: Message.types.alert,
        body: displayText,
        signals: signals.concat(...appendSignals),
        idlist: idlist.concat(...appendSignals.map(signal => (signal.type === '@' ? signal.val : null)).filter(item => !!item)),
      };
      return message;
    },
    buildTextMessage(text) {
      if (!text) {
        return null;
      }
      const message = {
        msgtype: 'm.text',
        body: text,
      };
      return message;
    },
    buildAlertMessage(rawText = '', mentions = []) {
      if (!rawText) {
        return null;
      }
      const idlist = mentions.filter(mention => mention && mention.trigger === '@').map(mention => mention.id);
      const message = {
        msgtype: Message.types.alert,
        body: rawText,
        idlist,
      };
      return message;
    },
    clearDraft(roomId) {
      this.changeValue = {};
      if (this.$refs.editor) {
        this.$refs.editor.clearText();
      }
      // this.deleteDraft(roomId);
    },
    deleteDraft(roomId) {
      const newDrafts = this.drafts.filter(draft => draft.roomId !== roomId);
      this.$matrix.deleteDraft(roomId);
      this.$store.dispatchGlobal('drafts', newDrafts);
    },
    handleUpload(files) {
      this.uploadQueue.unshift(...files);
      return true;
    },
    async handleUploadQueue(file, forceFile = false) {
      const maxFileSize = MAX_FILESIZE || (100 * 1024 * 1024); // default 100 MB
      if (file.size > maxFileSize) {
        this.$Message.error(`仅限发送不超过${maxFileSize / (1024 * 1024)}M的文件`);
        this.uploadQueue.pop();
        return;
      }
      if (forceFile) {
        // upload as file anyway
        this.handleOtherFileModel(file);
      } else if (file.type.startsWith('image')) {
        this.handleImageModel(file);
      } else if (file.type.startsWith('video')) {
        await this.handleVideoModel(file);
      } else {
        this.handleOtherFileModel(file);
      }
    },
    handleOtherFileModel(fileBlob) {
      let extention = '';
      if (fileBlob.name.split('.')[1]) {
        extention = fileBlob.name.split('.')[1].toLowerCase();
      }
      const iconUrl = iconTypeMatcher(extention);

      this.confirmFile = {
        show: true,
        title: `发送到:${this.viewingRoom.name.length > 16 ? `${this.viewingRoom.name.slice(0, 16)}...` : this.viewingRoom.name}`,
        icon: iconUrl,
        type: 'file',
        file: fileBlob,
        name: fileBlob.name,
        size: fileBlob.size > 1048576 ? `${parseInt(fileBlob.size / 1048576, 10)} MB` : `${parseInt(fileBlob.size / 1024, 10)} KB`,
      };
    },
    handleImageModel(fileBlob) {
      const imageUrl = window.URL.createObjectURL(fileBlob);
      this.confirmFile = {
        show: true,
        isImage: true,
        title: `发送到:${this.viewingRoom.name.length > 16 ? `${this.viewingRoom.name.slice(0, 16)}...` : this.viewingRoom.name}`,
        file: fileBlob,
        name: fileBlob.name,
        url: imageUrl,
      };
    },
    async handleVideoModel(fileBlob) {
      this.confirmFile = {
        show: true,
        isVideo: true,
        title: `发送到:${this.viewingRoom.name.length > 16 ? `${this.viewingRoom.name.slice(0, 16)}...` : this.viewingRoom.name}`,
        file: fileBlob,
        name: fileBlob.name,
        url: '',
      };
      const thumbnail = await canvasUtils.getThumbVideo(fileBlob, MAX_WIDTH, MAX_HEIGHT);
      const thumbnailUrl = URL.createObjectURL(thumbnail.blob);
      this.confirmFile = {
        show: true,
        isVideo: true,
        title: `发送到:${this.viewingRoom.name.length > 16 ? `${this.viewingRoom.name.slice(0, 16)}...` : this.viewingRoom.name}`,
        file: fileBlob,
        name: fileBlob.name,
        url: thumbnailUrl,
      };
    },
    handleFileConfirmClick(value) {
      this.confirmFile.show = false;
      if (this.uploadQueue.length) {
        const lastFile = this.uploadQueue.pop();
        if (!lastFile || !lastFile.size) {
          this.$Message.error('无效文件');
          return;
        }
        if (value) {
          if (lastFile.type.startsWith('image')) {
            this.handleImage(lastFile);
          } else if (lastFile.type.startsWith('video')) {
            this.handleVideo(lastFile);
          } else {
            this.handleOtherFile(lastFile);
          }
        } else if (this.confirmFile.url) {
          window.URL.revokeObjectURL(this.confirmFile.url);
        }
      }
    },
    handleUploadProgress() {

    },
    async handleImage(fileBlob) {
      // console.log('========handleImage========');
      const info = await canvasUtils.getImageInfo(fileBlob);
      if (!confirm) {
        return undefined;
      }
      if (!info) {
        // treat as normal file
        this.handleOtherFile(fileBlob);
        return undefined;
      }

      const content = {
        msgtype: Message.types.image,
        body: fileBlob.name,
        url: '',
        info: {
          mimetype: fileBlob.type,
          size: fileBlob.size,
          w: info.width,
          h: info.height,
        },
      };

      // const txnId = this.setMockMessage(content, fileBlob);
      let origin = fileBlob;
      if (this.viewingRoom.isEncryped) {
        const encrypedFile = await this.encryptFile(fileBlob);
        if (!encrypedFile.error) {
          origin = encrypedFile.file;
          content.file = encrypedFile.info;
        } else {
          // console.log(encrypedFile.error);
        }
      }
      // upload image to netdisk
      let imageResponse = {};
      // const mxEvent = this.rawRoom.findEventById(txnId);
      const mxEvent = null;
      // upload origin image with thumbnail url
      // console.log(this.$fcNetdisk);
      // console.log(this.$fcNetdisk.uploadNative);
      // console.log(JSON.parse(window.sessionStorage.getItem(IAM_INFO_KEY)));
      try {
        if (NET_DISK_API) {
          imageResponse = await this.$fcNetdisk.uploadGroup(origin, this.viewingRoomId, Message.types.image, content, false, {}, this.handleUploadProgress);
        } else {
          imageResponse = await this.$fcNetdisk.uploadNative(origin, this.viewingRoomId, {}, this.handleUploadProgress);
        }
      } catch(e) {
        console.log(e);
      }
      // console.log('await this.$fcNetdisk.uploadNative END');
      // set image url
      if (imageResponse.status) {
        if (this.viewingRoom.isEncryped) {
          content.file.url = imageResponse.data.netdiskID;
        }
        content.url = imageResponse.data.netdiskID;
        if (!content) {
          this.$Message.error('文件发送失败');
          // this.handlePendingEventError(txnId);
        }
        // this.removePendingEvent(txnId);
        const res = await this.sendMessage({ roomId: this.viewingRoomId, message: content });
        // if (res.status && res.data.eventId) {
          // this.cacheFile(res.data.eventId, fileBlob, content);
        // }
        // this.$refs['chat-records'].handleLatest();
      } else if (imageResponse.data.data.exp === 'token expired') {
        emitter.emit('TOKEN_INVALID');
      }  else {
        // this.handlePendingEventError(txnId);
      }
    },
    removePendingEvent(txnId) {
      try {
        const mxEvent = this.rawRoom.findEventById(txnId);
        this.rawRoom.updatePendingEvent(mxEvent, 'queued');
        this.$matrix.get().cancelPendingEvent(mxEvent);
      } catch (error) {
        // console.log(error);
      }
    },
    async handleVideo(fileBlob) {
      const thumbnail = await canvasUtils.getThumbVideo(fileBlob, MAX_WIDTH, MAX_HEIGHT);
      if (!thumbnail) {
        // treat as normal file
        this.handleOtherFile(fileBlob);
        return null;
      }
      const thumbnailUrl = URL.createObjectURL(thumbnail.blob);

      const content = {
        msgtype: Message.types.video,
        body: fileBlob.name,
        url: '',
        info: {
          mimetype: fileBlob.type,
          size: fileBlob.size,
          w: thumbnail.width,
          h: thumbnail.height,
          duration: thumbnail.duration,
          thumbnail_url: thumbnailUrl,
          thumbnail_info: thumbnail.info,
        },
      };

      const txnId = this.setMockMessage(content, fileBlob);
      // if (this.viewingRoom.isEncryped) {
      //   this.handlePendingEventError(txnId);
      //   return null;
      // }
      let origin = fileBlob;
      if (this.viewingRoom.isEncryped) {
        const encrypedFile = await this.encryptFile(fileBlob);
        if (!encrypedFile.error) {
          origin = encrypedFile.file;
          content.file = encrypedFile.info;
        } else {
          // console.log(encrypedFile.error);
        }
      }
      // upload video to netdisk
      let thumbnailResponse = {};
      let videoResponse = {};
      const mxEvent = this.rawRoom.findEventById(txnId);
      // upload thumbnail
      try {
        if (NET_DISK_API) {
          thumbnailResponse = await this.$fcNetdisk.uploadGroup(thumbnail.blob, this.viewingRoomId, Message.types.image, content, true);
        } else {
          thumbnailResponse = await this.$fcNetdisk.uploadNative(thumbnail.blob, this.viewingRoomId);
        }
      } catch(e) {
        console.log(e);
      }
      // set thumbnail url
      if (thumbnailResponse.status) {
        window.URL.revokeObjectURL(content.info.thumbnail_url);
        content.info.thumbnail_url = thumbnailResponse.data.netdiskID;
      }
      // upload origin video with thumbnail url
      try {
        if (NET_DISK_API) {
          videoResponse = await this.$fcNetdisk.uploadGroup(origin, this.viewingRoomId, Message.types.video, content, false, mxEvent, this.handleUploadProgress);
        } else {
          videoResponse = await this.$fcNetdisk.uploadNative(origin, this.viewingRoomId, mxEvent, this.handleUploadProgress);
        }
      } catch(e) {
        console.log(e);
      }
      // set video url
      if (videoResponse.status) {
        content.url = videoResponse.data.netdiskID;
        // return { content, txnId };
        if (!content) {
          this.$Message.error('文件发送失败');
          this.handlePendingEventError(txnId);
        }
        this.removePendingEvent(txnId);
        const res = await this.sendMessage({ roomId: this.viewingRoomId, message: content });
        // if (res.status && res.data.eventId) {
        //   this.cacheFile(res.data.eventId, fileBlob, content);
        // }
        // this.$refs['chat-records'].handleLatest();
      } else if (videoResponse.data.data.exp === 'token expired') {
        emitter.emit('TOKEN_INVALID');
      } else {
        this.handlePendingEventError(txnId);
        window.URL.revokeObjectURL(thumbnailUrl);
      }
    },
    async handleOtherFile(fileBlob) {
      // console.log('========handleOtherFile========');
      const content = {
        msgtype: Message.types.file,
        body: fileBlob.name,
        url: '',
        info: {
          mimetype: fileBlob.type,
          size: fileBlob.size,
        },
      };
      // const txnId = this.setMockMessage(content, fileBlob);
      let origin = fileBlob;
      if (this.viewingRoom.isEncryped) {
        const encrypedFile = await this.encryptFile(fileBlob);
        if (!encrypedFile.error) {
          origin = encrypedFile.file;
          content.file = encrypedFile.info;
        }
      }
      let response = {};
      // const mxEvent = this.rawRoom.findEventById(txnId);
      const mxEvent = null;

      try{
        if (NET_DISK_API) {
          response = await this.$fcNetdisk.uploadGroup(origin, this.viewingRoomId, Message.types.file, content, false, mxEvent, this.handleUploadProgress);
        } else {
          response = await this.$fcNetdisk.uploadNative(origin, this.viewingRoomId, mxEvent, this.handleUploadProgress);
        }
      } catch(e) {
        console.log(err);
      }
      if (response.status) {
        if (this.viewingRoom.isEncryped) {
          content.file.url = response.data.netdiskID;
        }
        content.url = response.data.netdiskID;

        if (!content) {
          this.$Message.error('文件发送失败');
          // this.handlePendingEventError(txnId);
        }
        // this.removePendingEvent(txnId);
        const res = await this.sendMessage({ roomId: this.viewingRoomId, message: content });
        // if (res.status && res.data.eventId) {
        //   // this.cacheFile(res.data.eventId, fileBlob, content);
        // }
        // this.$refs['chat-records'].handleLatest();
      } else if (response.data.data.exp === 'token expired') {
        emitter.emit('TOKEN_INVALID');
      } else {
        // this.handlePendingEventError(txnId);
      }
    },
    setMockMessage(content, fileBlob) {
      const txnId = Matrix.get().makeTxnId();
      if (!this.viewingRoom.roomId) {
        return {
          mxEvent: null,
          txnId,
        };
      }
      // const mxEvent = new MatrixEvent({
      //   content,
      //   state_key: '',
      //   type: 'm.room.message',
      //   sender: this.userInfo.id,
      //   room_id: this.viewingRoomId,
      //   event_id: txnId,
      //   membership: this.viewingRoom.membership,
      //   pending: {
      //     progress: 0,
      //     fileBlob,
      //   },
      // });
      // mxEvent.status = 'sending';
      // mxEvent.sender = this.rawRoom.getMember(this.userInfo.id);
      // this.rawRoom.addPendingEvent(mxEvent, txnId);
      return txnId;
    },
  }, 
  computed: {
    ...mapState(['showRoomList', 'windowHeight', 'windowWidth', 'userList', 'myinfo', 'hasOldTimelineTable', 'chatRoom', 'roomListWidth', 'editorHeight', 'editorDraging']),
    roomList() {
      // // console.log('VUEX STORE: roomList');
      // // console.log(this.$store.state.roomList);
      return this.$store.state.roomList;
    },
    roomTimeLine() {
      console.log('VUEX STORE: roomTimeLine');
      console.log(this.$store.state.roomTimeLine);
      return this.$store.state.roomTimeLine[this.viewingRoomId] && this.$store.state.roomTimeLine[this.viewingRoomId].filter(e => !e.isRedacted);
    },
    viewingRoom() {
      return this.roomList.find(room => room.roomId === this.viewingRoomId) || {};
    },
  },
  watch: {
    uploadQueue(newVal) {
      if (newVal.length) {
        const lastFile = newVal[newVal.length - 1];
        this.handleUploadQueue(lastFile);
      }
    },
    // timeLineFix(val) {
    //   // console.log('timeLineFix change!!', val);
    // },
  },
}
</script>

<style lang="scss">
.chat-room{
    width:  calc(100% - 241px);
    display: flex;
    flex-direction: column;
    &.full-screen{
        width: 100%;
    }
    .room-title{
        height:50px;
        background-color: #ffffff;
        border-bottom:1px solid #eaeaea;
        font-size:17px;
        color:#333333;
        padding: 0px 20px;
        line-height: 50px;
        .room-title-name{
          display: inline-block;
          vertical-align: middle;
          width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .room-tools{
          display: inline-block;
          vertical-align: middle;
          float: right;
        }
    }
    .timeline-list{
        height: calc(100% - 211px);
        overflow-y: auto;
        position: relative;
        background-color: #f5f5f6;
        box-sizing: border-box;
        padding: 18px 20px;
        &.cannot-scroll{
          overflow: hidden;
        }
        .go-to-bottom-btn{
          position: fixed;
          right: 10px;
          bottom: 165px;
          cursor: pointer;
          padding: 2px 10px;
          background-color: #ffffff;
          color: #4285f4;
          border: 1px solid #dedede;
          box-shadow: 0 0 5px #dedede;
        }
        .go-to-up-btn{
          position: fixed;
          right: 10px;
          top: 55px;
          cursor: pointer;
          padding: 2px 10px;
          background-color: #ffffff;
          color: #4285f4;
          border: 1px solid #dedede;
          box-shadow: 0 0 5px #dedede;
        }
    }
    .operation-bar{
        height: 46px;
        padding: 14px 20px;
        background-color: #ffffff;
        .operation-icon{
          width: 18px;
          height: 18px;
          margin-right: 20px;
          cursor: pointer;
          &:last-of-type{
            margin-right: 0;
          }
        }
    }
    .msg-edit{
        // height: 160px;
        border-top: 1px solid rgba(0, 0, 0, 0.05);
        position: relative;
        box-sizing: border-box;
        background-color: #ffffff;
        .editing-area{
          width: 100%;
          height: 97px;
          border: none;
          outline: none;
          padding: 0 20px;
          box-sizing: border-box;
          resize: none;
        }
        .send-btn{
          width: 54px;
          height: 26px;
          border-radius: 4px;
          border: solid 1px #eaeaea;
          font-family: PingFangSC-Regular;
          font-size: 12px;
          font-weight: normal;
          font-stretch: normal;
          letter-spacing: 0px;
          color: #9b9b9b;
          position: absolute;
          right: 21px;
          bottom: 12px;
          text-align: center;
          line-height: 26px;
          background-color: #ffffff;
        }
    }
    .editor-drag-drop{
      position: absolute;
      height: 4px;
      cursor: row-resize;
      right: 0;
      z-index: 1;
    }
}
.file-confirm-modal {
  .ivu-modal {
    width: 480px !important;
    height: 400px !important;
  }
  .file-confirm-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 0 10px;
    .image {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      flex: 1;
    }
    .icon {
      position: absolute;
      width: 40px;
      height: 40px;
    }
    .file-icon {
      height: 50px;
      width: 50px;
      margin: 30px auto 20px auto;
    }
    .filename {
      width: 100%;
      text-align: center;
      vertical-align: middle;
      margin-bottom: 4px;
    }
    .size {
      text-align: center;
      vertical-align: middle;
    }
  }
  .action {
    width: 60px;
    height: 26px;
  }
}
</style>


