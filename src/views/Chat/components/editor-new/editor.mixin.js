import emojione from 'emojione';
// import eventBridge from '@/utils/event-bridge';
import { cliperboardImgToLocalPath } from '@/utils/common';
import canvasUtils from '@/utils/canvas';
import { iconTypeMatcher } from '@/utils/icon';

const ENABLE_CHAT_RECORD = false;
const MAX_FILESIZE = 10485760;

export default {
  data() {
    return {
      editorContent: '',
      ifShowAtList: false,
      ifShowEmojiPicker: false,
      curHoverUserId: '', // 当前hover的那个被at的用户id
      compositionInputing: false, // 键盘是否正在输入
      // atIntervalId 为一个计时器，用于计算 ’@‘到光标之间的 string， 用来为allist做filter
      // esc 和 插入@区块会清除这个计时器
      // 在按下@键之后弹出区块时会开始计时
      atIntervalId: '',
      lastInputData: '',
      atFilter: '',
      savedRange: null,

      enableChatRecord: ENABLE_CHAT_RECORD, // eslint-disable-line
      uploadQueue: [],
      confirmFile: {},
      lastTypingTime: 0,
    };
  },
  methods: {
    handleUpload(files) {
      this.uploadQueue.unshift(...files);
      return true;
    },
    async handleUploadQueue(file, forceFile = false) {
      const maxFileSize = MAX_FILESIZE || (100 * 1024 * 1024); // default 100 MB
      console.log(file);
      console.log(file.size);
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
      } else {
        this.handleOtherFileModel(file);
      }
    },
    handleImageModel(fileBlob) {
      const imageUrl = window.URL.createObjectURL(fileBlob);
      this.confirmFile = {
        show: true,
        isImage: true,
        title: `发送到:${this.roomEntity.name.length > 16 ? `${this.roomEntity.name.slice(0, 16)}...` : this.roomEntity.name}`,
        file: fileBlob,
        name: fileBlob.name,
        url: imageUrl,
      };
    },
    handleFileConfirmClick(value) {
      // this.confirmFile.show = false;
      // if (this.uploadQueue.length) {
      //   const lastFile = this.uploadQueue.pop();
      //   if (!lastFile || !lastFile.size) {
      //     this.$Message.error('无效文件');
      //     return;
      //   }
      //   if (value) {
      //     this.handleSendFile(lastFile);
      //   }
      //   if (this.confirmFile.url) {
      //     window.URL.revokeObjectURL(this.confirmFile.url);
      //   }
      // }
      this.confirmFile.show = false;
      if (this.uploadQueue.length) {
        const lastFile = this.uploadQueue.pop();
        if (!lastFile || !lastFile.size) {
          this.$Message.error('无效文件');
          return;
        }
        if (value) {
          if (lastFile.type.startsWith('image')) {
            this.$emit('handleImage', lastFile);
          } else if (lastFile.type.startsWith('video')) {
            this.$emit('handleVideo', lastFile);
          } else {
            this.$emit('handleOtherFile', lastFile);
          }
        } else if (this.confirmFile.url) {
          window.URL.revokeObjectURL(this.confirmFile.url);
        }
      }
    },
    handleOtherFileModel(fileBlob) {
      console.log('handleOtherFileModel', fileBlob);
      let extention = '';
      if (fileBlob.name.split('.')[1]) {
        extention = fileBlob.name.split('.')[1].toLowerCase();
      }
      const iconUrl = iconTypeMatcher(extention);
      this.confirmFile = {
        show: true,
        title: `发送到:${this.roomEntity.name.length > 16 ? `${this.roomEntity.name.slice(0, 16)}...` : this.roomEntity.name}`,
        icon: iconUrl,
        type: 'file',
        file: fileBlob,
        name: fileBlob.name,
        size: fileBlob.size > 1048576 ? `${parseInt(fileBlob.size / 1048576, 10)} MB` : `${parseInt(fileBlob.size / 1024, 10)} KB`,
      };
    },
    insertEmoji(emoji) {
      if (this.isCursorInEditor() && this.savedRange) {
        this.restoreCursorPos();
      } else {
        this.focus();
      }
      setTimeout(() => {
        document.execCommand('insertHTML', false, emojione.unicodeToImage(emoji));
      }, 10);
      this.ifShowEmojiPicker = false;
    },
    restoreCursorPos() {
      if (this.savedRange) {
        const range = window.getSelection();
        range.removeAllRanges();
        range.addRange(this.savedRange);
      }
    },
    saveCursorPos() {
      const range = window.getSelection();
      if (range.getRangeAt && range.rangeCount) {
        this.savedRange = range.getRangeAt(0);
      }
    },
    handleOpenEmoji() {
      this.$refs.editor.focus();
      if (this.roomEntity && this.roomEntity.isBan) {
        this.$Message.error('房间已禁言');
        return;
      }
      this.saveCursorPos();
      setTimeout(() => {
        this.ifShowEmojiPicker = true;
      }, 10);
    },
    handleScreenshot() {
      if (this.roomEntity && this.roomEntity.isBan) {
        this.$Message.error('房间已禁言');
        return;
      }
      window.finstation.sendMessage('SCREENSHOT');
    },
    handleOpenChatRecord() {
      if (window.finstation) {
        // 重写逻辑
        window.finstation.sendMessage(undefined, 'OPEN_CHAT_RECORD', {
          roomName: this.roomEntity.name,
          roomId: this.roomEntity.roomId,
        }, 'webview');
        window.finstation.addons.launch({
          name: `聊天记录-${this.roomEntity.name}`,
          id: 'com.finogeeks.personal.chatRecord',
          disableNavigationBar: true,
          single: true,
          // url: 'http://localhost:9080/chat-record.html',
          url: VIEW_CHAT_RECORD, //eslint-disable-line
          width: 700,
          height: 620,
          frame: false,
          powerLevel: 5,
          type: 'window',
          meta: {
            roomName: this.roomEntity.name,
            roomId: this.roomEntity.roomId,
          },
        });
      }
    },
    handleCloseEmoji() {
      this.restoreCursorPos();
      this.ifShowEmojiPicker = false;
    },
    focus() {
      if (!this.roomEntity.roomId) return;
      const range = window.getSelection();
      range.selectAllChildren(document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`));
      range.collapseToEnd();
    },
    handleAtItemHover(member) {
      this.curHoverUserId = member.userId;
    },
    isCursorInEditor() {
      console.log('isCursorInEditor');
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      const anchorNode = getSelection().anchorNode;
      // console.log(editorNode);
      // console.log(anchorNode);
      // console.log(anchorNode.parentElement.attributes.contenteditable);
      // console.log(anchorNode.parentElement.attributes.contenteditable.nodeValue);
      if (anchorNode.parentElement.attributes.contenteditable && anchorNode.parentElement.attributes.contenteditable.nodeValue === 'false') return false;
      return editorNode.contains(anchorNode);
    },
    getCursorStr() {
      const selection = getSelection();
      const content = (selection.anchorNode && selection.anchorNode.textContent) || '';
      const range = selection.getRangeAt(0);
      return {
        before: (content && content[range.startOffset - 1]) || null,
        after: (content && content[range.startOffset]) || null,
      };
    },
    findAtFilterStr() {
      const selection = getSelection();
      const content = (selection.anchorNode && selection.anchorNode.textContent) || '';
      if (!content) return null;
      const range = selection.getRangeAt(0);
      const endIndex = range.endOffset;
      const stratIndex = content.lastIndexOf('@', endIndex - 1);
      if (stratIndex === -1) return null;
      return content.substring(stratIndex + 1, endIndex);
    },
    handleKeyEvent(e) {
      // console.log('handleKeyEvent');
      // console.log(e);
      // console.log(e, e.metaKey, e.keyCode);
      // console.log(window.getSelection());
      // console.log('handleKeyEvent', this.roomEntity.roomId, e);

      // if (e.key === 'F1') {
      //   this.saveCursorPos();
      // }
      // if (e.key === 'F2') {
      //   this.restoreCursorPos();
      // }
      if (e.keyCode === 8) {
        const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
        let str = editorNode.innerHTML;
        if (str === '<br>') {
          editorNode.innerHTML = '';
        }
      }
      if (this.confirmFile.show) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.handleFileConfirmClick(false);
          this.focus();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleFileConfirmClick(true);
          this.focus();
          return;
        }
      }
      if (this.ifShowAtList) {
        if (e.key === 'Backspace') {
          if (this.getCursorStr().before === '@') {
            this.closeAtList();
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          this.closeAtList();
        }
        if (e.key === 'Enter') {
          if (this.curHoverUserId) {
            e.preventDefault();
            this.handleInsertAtBlock();
            return;
          }
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const curInx = this.filtedAtList.findIndex(item => item.userId === this.curHoverUserId);
          if (curInx > 0) {
            this.curHoverUserId = this.filtedAtList[curInx - 1].userId;
            document.getElementById(`hoveredAtBlock-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`).scrollIntoView(false);
          }
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const curInx = this.filtedAtList.findIndex(item => item.userId === this.curHoverUserId);
          if (curInx < this.filtedAtList.length - 1 && this.filtedAtList.length > 0) {
            this.curHoverUserId = this.filtedAtList[curInx + 1].userId;
            document.getElementById(`hoveredAtBlock-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`).scrollIntoView();
          }
        }
      }
      if (e.key === 'Enter') {
        console.log(`e.key === 'Enter'`);
        console.log(this.canSend);
        e.preventDefault();
        if (!this.canSend) return;
        if (e.ctrlKey || e.metaKey || e.altKey) {
          document.execCommand('insertHTML', false, '<br></br>');
          return;
        }
        if (e.shiftKey || this.compositionInputing) return;
        this.sendTextMessage();
      }
      // 去除Crtl+b/Ctrl+i/Ctrl+u等快捷键 不然会修改contenteditable内容
      if (e.ctrlKey || e.metaKey) {
        if (e.keyCode === 66 || e.keyCode === 98 || e.keyCode === 73 || e.keyCode === 105 || e.keyCode === 85 || e.keyCode === 117) e.preventDefault();
      }
    },
    async handlePaste(e) {
      console.log('handlePaste');
      console.log(this.isCursorInEditor());
      if (this.isCursorInEditor()) {
        e && e.preventDefault();
        let plainText = '';
        const clipboardData = e.clipboardData;
        console.log(clipboardData);
        console.log(clipboardData.types);
        // console.log(clipboardData.items[1].getAsFile());
        // console.log(clipboardData.items[1]);
        const lastItem = clipboardData.items[clipboardData.items.length - 1];
        console.log(lastItem);
        if (lastItem && lastItem.getAsFile()) {
          const file = lastItem.getAsFile();
          this.handleUpload([file]);
        } else if (clipboardData.types.indexOf('text/plain') > -1 || clipboardData.types.indexOf('text/html') > -1) {
          plainText = clipboardData.getData('text/plain');
          if (plainText.length > 5000) {
            this.$Message.error('消息过长，无法粘贴');
            return;
          }
          document.execCommand('insertHTML', false, emojione.unicodeToImage(plainText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r\n/g, '<br>').replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')));
        } else if (clipboardData.types.indexOf('Files') > -1) {
          const file = clipboardData.files[0];
          this.handleUpload([file]);
        }
      }
    },

    handleContextMenu() {
      window.finstation && window.finstation.buildContextMenu([
        {
          label: '剪切',
          role: 'cut',
        },
        {
          label: '复制',
          role: 'copy',
        },
        {
          label: '粘贴',
          click: () => this.handlePaste(),
        },
      ]);
    },
    originContent() {
      if (!this.roomEntity.roomId) return '';
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      let str = editorNode.innerHTML;
      return str;
    },
    parseContent() {
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      let str = editorNode.innerHTML;
      str = str.replace(/<span>/g, '').replace(/<\/span>/g, '').replace(/<br>/g, '\n').replace(/&nbsp;/g, ' ');

      if (str.length > 6000) {
        this.$Message.error('消息过长，无法发送');
        return;
      }

      // parse emojione img tags
      const emojitags = str.match(/<img class="emojione" .+?>/g);
      emojitags && emojitags.length && emojitags.forEach((item) => {
        const emoji = item.match(/alt="(.+?)"/);
        str = str.replace(item, emoji[1]);
      });

      // parse atlist
      const idlist = [];
      const signals = [];
      let matchItem = /<label data-user-id="(.+?)" .+?>(.+?)<\/label>/g.exec(str);
      while (matchItem) { //eslint-disable-line
        idlist.push(matchItem[1]);
        str = str.replace(matchItem[0], matchItem[2]);
        signals.push({
          start: matchItem.index,
          end: matchItem.index + matchItem[2].length,
          type: '@',
          val: matchItem[1],
        });
        matchItem = /<label data-user-id="(.+?)" .+?>(.+?)<\/label>/g.exec(str);
      }
      str = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      if (idlist.length) return { msgtype: 'm.alert', body: str, idlist, signals };
      return { msgtype: 'm.text', body: str };
    },
    showAtList() {
      this.ifShowAtList = true;
      this.curHoverUserId = this.filtedAtList[0].userId;
      if (!this.atIntervalId) this.startAtInterval();
    },
    closeAtList() {
      this.ifShowAtList = false;
      this.curHoverUserId = '';
      clearInterval(this.atIntervalId);
      this.atIntervalId = null;
    },
    startAtInterval() {
      this.atIntervalId = setInterval(() => {
        if (!this.isCursorInEditor()) {
          this.ifShowAtList = false;
        } else {
          this.ifShowAtList = true;
          this.atFilter = this.findAtFilterStr();
        }
      }, 500);
    },
    handleEditorChange(e) {
      if (e.data === '@') {
        if (this.roomEntity.isDirect) return;
        const selection = window.getSelection();
        const focusNode = selection.focusNode;
        this.focuseNode = focusNode;
        this.showAtList();
      }
      this.handleUserTyping();
    },
    handleOpenFile() {
      if (this.roomEntity && this.roomEntity.isBan) {
        this.$Message.error('房间已禁言');
        return;
      }
      if (this.roomEntity && this.roomEntity.isQQRoom && !this.isQQServerWorking) {
        this.$Message.error('QQ服务不可用');
        return;
      }
      this.$refs.editorFiles.click();
    },
    handleComposition(isInputing) {
      // console.log('handleComposition', isInputing);
      this.compositionInputing = isInputing;
    },
    replaceEmojiWithImg() {
      if (!this.roomEntity.roomId) {
        setTimeout(() => {
          this.replaceEmojiWithImg();
        }, 1000);
        return;
      }
      const editorNode = document.getElementById(`editor-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((item) => {
          if (item.type === 'characterData') {
            // if (item.target.data && item.target.data.match(/(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g)) {
            // if (!item.target.data || item.target.data.length > 500) return;
            if (item.target.data && item.target.data.match(/(\ud83c[\udf00-\udfff])|(\ud83d[\udc00-\ude4f\ude80-\udeff])|[\u2600-\u2B55]/g)) {
              const target = getSelection().anchorNode;
              const spanNode = document.createElement('span');
              // 该死的win10 emoji表情兼容！
              if (!item.oldValue) {
                spanNode.innerHTML = '';
                item.target.parentNode.replaceChild(spanNode, item.target);
                return;
              }
              spanNode.innerHTML = emojione.unicodeToImage(target.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
              item.target.parentNode.replaceChild(spanNode, item.target);
              let idx = [].findIndex.call(spanNode.childNodes, item => item.tagName === 'IMG');
              if (idx === -1) idx = spanNode.childNodes.length - 1;
              getSelection().setBaseAndExtent(spanNode, idx + 1, spanNode, idx + 1);
            }
          }
        });
      });
      const options = {
        characterData: true,
        characterDataOldValue: true,
        subtree: true,
      };
      observer.observe(editorNode, options);
    },
    insertAtBlock(innerHtml) {
      console.log('isCursorInEditor: ', this.isCursorInEditor());
      // if (!this.isCursorInEditor()) return;
      const selection = getSelection();
      console.log(selection);
      const tempnode = document.createElement('span');
      tempnode.innerHTML = innerHtml;
      const content = (selection.anchorNode && selection.anchorNode.textContent) || '';
      console.log('content: ',content);
      const range = selection.getRangeAt(0);
      console.log('range: ', range);
      let endIndex = range.endOffset;
      console.log('endIndex: ', endIndex);
      const atIndex = content.lastIndexOf('@', endIndex - 1);
      endIndex = atIndex + 1;
      console.log('atIndex, endIndex : ',atIndex, endIndex);
      if (atIndex > -1) range.setStart(selection.anchorNode, atIndex);
      if (atIndex > -1) range.setEnd(selection.anchorNode, endIndex);
      console.log('range: ', range);
      range.deleteContents();
      range.insertNode(tempnode.lastChild);
      range.collapse();
      document.execCommand('insertText', false, ' ');
      this.closeAtList();
    },
    async blob2FileInfo(fileBlob) {
      const fileInfo = {
        name: fileBlob.name,
        path: fileBlob.path,
        size: fileBlob.size,
        type: fileBlob.type,
      };
      if (fileBlob.type.startsWith('image')) {
        const imageInfo = await canvasUtils.getImageInfo(fileBlob);
        fileInfo.width = imageInfo.width;
        fileInfo.height = imageInfo.height;
        if (fileBlob.base64Contents) {
          fileInfo.base64Contents = fileBlob.base64Contents;
        }
      }
      return fileInfo;
    },
    handleClickCloseEmoji(e) {
      if (!this.ifShowEmojiPicker) return;
      const epickerNode = document.getElementById(`epicker-${this.roomEntity.roomId.replace(/!|:|\./g, '')}`);
      if (!epickerNode) return;
      if (!epickerNode.contains(e.target) && this.ifShowEmojiPicker) {
        this.ifShowEmojiPicker = false;
      }
    },
    handleUserTyping() {
      // if (Date.now() - this.lastTypingTime >= 4 * 1000) {
      //   eventBridge.proxy.userTyping(this.roomEntity.roomId);
      //   this.lastTypingTime = Date.now();
      // }
    },
  },
  watch: {
    filtedAtList() {
      this.curHoverUserId = (this.filtedAtList[0] && this.filtedAtList[0].userId) || null;
    },
    uploadQueue(newVal) {
      if (newVal.length) {
        const lastFile = newVal[newVal.length - 1];
        this.handleUploadQueue(lastFile);
      }
    },
  },
  mounted() {
    window.document.addEventListener('keydown', this.handleKeyEvent);
    window.document.addEventListener('paste', this.handlePaste);
    window.document.addEventListener('mousedown', this.handleClickCloseEmoji);
    // if (window.finstation.getPlatform() === 'darwin') {
    //   window.document.addEventListener('compositionstart', this.handleComposition.bind(this, true));
    //   window.document.addEventListener('compositionend', this.handleComposition.bind(this, false));
    // }
    setTimeout(() => {
      this.replaceEmojiWithImg();
      this.focus();
    }, 10);
  },
  beforeDestroy() {
    window.document.removeEventListener('keydown', this.handleKeyEvent);
    window.document.removeEventListener('paste', this.handlePaste);
    window.document.removeEventListener('mousedown', this.handleClickCloseEmoji);
    // if (window.finstation.getPlatform() === 'darwin') {
    //   window.document.removeEventListener('compositionstart', this.handleComposition.bind(this, true));
    //   window.document.removeEventListener('compositionend', this.handleComposition.bind(this, false));
    // }
    clearInterval(this.atIntervalId);
  },
};
