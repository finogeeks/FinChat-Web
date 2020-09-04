<template>
  <div class="wrapper" id="fc-editor">
    <!-- <suggestion
      :suggestions="suggestions"
      :option="suggestionOption"
      @click="onSuggestionClick"
    /> -->
    <div class="editor-wrapper">
      <DraftJSEditor ref="editor" class="native-editor"
        :disabled="disabled"
        :placeholder="placeholder"
        :config="config"
        :toolbar="toolbar"
        :on-context-menu="handleContextMenu"
        @key-search="handleGlobalSearch"
        @files="onChangeFiles"
        @trigger="onTrigger"
        @input="onChangeText"
        @click="onTextClick"
        @send="onSend"
        @paste="onPaste"
        @tab="onTab"
      />
    </div>
  </div>
</template>

<script>
import DraftJSEditor from '@finogeeks/draftjs-editor';
import { toArray as _toArray } from 'lodash';
import commonUtils from '@/utils/common';
import canvasUtils from '@/utils/canvas';
import emitter from '@/utils/event-emitter';
// import Suggestion from './suggestion';
import '@finogeeks/draftjs-editor/dist/editor.css';

// const tools = {

// };

const MAX_INPUT_LENGTH = 6000;

export default {
  name: 'editor',
  components: { DraftJSEditor },
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    disabledMessage: {
      type: String,
      required: false,
      default: '全员禁言中',
    },
    suggestions: {
      type: Array,
      required: false,
      default: () => [],
    },
    suggestionOption: {
      type: Object,
      required: false,
      default: () => {},
    },
    onSearch: Function,
    tools: Array,
  },
  mounted() {
      
  },
  data() {
    return {
      editor: null,
      currentValue: {},
      placeholder: '请输入内容',
      config: {
        imagePath: commonUtils.getEmojiUrl(),
        imageType: 'png',
        maxLine: 7,
        minLine: 7,
        fontSize: 14,
        defaultPersonImagePath: './static/assets/global_avatar_default.svg',
      },
      toolbar: [],
      toolDefaultConfig: {
        EMOTICON: {
          name: 'EMOTICON',
          icon: './static/assets/input_emoji_default.svg',
          config: {
            iconUrl: './static/assets/emoticon/',
            emojiUrl: commonUtils.getEmojiUrl(),
            imageType: 'png',
          },
        },
        FILE: {
          name: 'FILE',
          icon: './static/assets/input_file_default.svg',
        },
        CAPTURE: {
          name: 'CAPTURE',
          icon: './static/assets/input_screenshot_default.svg',
        },
        AUDIO_CALL: {
          name: 'AUDIO_CALL',
          icon: './static/assets/input_call_default.svg',
        },
        VIDEO_CALL: {
          name: 'VIDEO_CALL',
          icon: './static/assets/input_video_default.svg',
        },
        BIM: {
          name: 'BIM',
          icon: './static/assets/input_BIM_default.svg',
        },
        RECORD: {
          name: 'RECORD',
          icon: './static/assets/input_RECORD_default.svg',
        },
        EVALUATE: {
          name: 'EVALUATE',
          icon: './static/assets/input_evaluate_default.svg',
        },
        TRANSFER: {
          name: 'TRANSFER',
          icon: './static/assets/input_order_transfer_default.svg',
        },
      },
    };
  },
  methods: {
    resetText() {
      if (this.$refs.editor) {
        this.$refs.editor.resetText();
      }
    },
    handleContextMenu() {
      if (this.disabled) {
        return;
      }
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
          click: () => this.onPaste(window.finstation.getClipboardData()),
        },
      ]);
    },
    async handlePastedImage(imgData) {
      const blob = await canvasUtils.getBlobFromBase64(imgData);
      if (!blob) {
        typeof window.finstation === 'object' && window.finstation.sendMessage('GET_WIN_EVN', 'PASTE');
      }
      this.onChangeFiles([blob]);
    },
    async handlePastedFile(pathname) {
      if (typeof window.finstation === 'object' && typeof window.finstation.getBlobFromPath === 'function') {
        const blob = await window.finstation.getBlobFromPath(pathname);
        if (!blob) {
          typeof window.finstation === 'object' && window.finstation.sendMessage('GET_WIN_EVN', 'PASTE');
        }
        this.onChangeFiles([blob]);
      }
    },
    handlePastedText(text) {
      // const strArr = _toArray(text);
      // if (strArr.length > MAX_INPUT_LENGTH) {
      //   this.$Message.warning(`最多发送 ${MAX_INPUT_LENGTH} 个字符，超过将自动截断`);
      //   this.appendText(this.$jsxss(strArr.slice(0, MAX_INPUT_LENGTH).join('')));
      //   return;
      // }
      this.appendText(this.$jsxss(text));
    },
    handleSignalSearch(trigger, term) {
      if (this.onSearch) {
        return this.onSearch(trigger, term) || [];
      }
      return [];
    },
    handleGlobalSearch() {
    //   emitter.emit('WINDOW_SEARCH');
    },
    appendText(text) {
      if (this.$refs.editor) {
        this.$refs.editor.insertText(text || '');
      }
    },
    replaceText(content, offset) {
      if (this.$refs.editor && typeof content === 'string') {
        this.$refs.editor.replaceText(content, offset);
      } else {
        this.$refs.editor.resetBlock(content);
      }
    },
    clearText() {
      if (!this.disabled && this.$refs.editor) {
        this.$refs.editor.resetText();
      }
    },
    insertSignal(type = '', id = '', value = '') {
      if (this.$refs.editor) {
        this.$refs.editor.insertSignal({ type, id, value });
      }
    },
    focus() {
      if (!this.disabled && this.$refs.editor) {
        this.$refs.editor.focus();
      }
    },
    handleIgnoreEnter(flag) {
      if (this.$refs.editor) {
        this.$refs.editor.handleIgnoreEnter(flag);
      }
    },
    onChangeFiles(files) {
      if (files.length === 0) {
        return;
      }
      if (this.disabled) {
        this.$Message.error(this.disabledMessage);
        return;
      }
      this.$emit('event', { type: 'upload', payload: files });
    },
    onChangeText(output) {
      this.currentValue = output;
    },
    onTextClick(action) {
      this.$emit('text-click', action);
    },
    onSend(output) {
      if (!output) {
        return;
      }
      if (this.disabled) {
        this.$Message.error(this.disabledMessage);
        return;
      }
      if (output && output.text && output.text.length > MAX_INPUT_LENGTH) {
        // output.text = output.text.slice(0, MAX_INPUT_LENGTH);
        this.$Message.warning(`最多发送 ${MAX_INPUT_LENGTH} 个字符`);
      } else {
        this.$emit('event', { type: 'send', payload: output });
      }
    },
    onPaste(clipboardData) {
      // console.log('onPaste');
      if (!clipboardData) {
        return;
      }
      if (this.disabled) {
        this.$Message.error(this.disabledMessage);
        return;
      }
      if (clipboardData.type === 'text') {
        this.handlePastedText(clipboardData.data);
      } else if (clipboardData.type === 'image') {
        this.handlePastedImage(clipboardData.data);
      } else if (clipboardData.type === 'file') {
        this.handlePastedFile(clipboardData.data);
      }
    },
    onTab() {
    //   emitter.emit('WINDOW_TAB');
    },
    onTrigger({ type, value }) {
      this.$emit('trigger', { trigger: type, term: value });
    },
    onSuggestionClick({ index, id, value }) {
      this.$emit('suggestion-click', { index, id, value });
    },
    asyncShowWindows () {
      window.onFinChatReady = async () => {
        await window.finstation.addons.launch({
                name: `聊天记录`,
                id: 'com.finogeeks.personal.chatRecord',
                autoShow: false,
                disableNavigationBar: true,
                url: `${VIEW_CHAT_RECORD}`,
                width: 700,
                height: 620,
                powerLevel: 5,
                type: 'window'
              });
      }
    },
  },
  created() {
    if (this.tools && this.tools.length) {
      this.toolbar = this.tools.map((tool) => {
        if (tool && tool.name) {
          return {
            ...this.toolDefaultConfig[tool.name],
            click: tool.callback,
          };
        }
        return null;
      }).filter(tool => tool);
    }
    this.asyncShowWindows();
  },
  beforeDestroy() {
    this.editor = null;
  },
  watch: {
    currentValue(newVal) {
      this.$emit('event', { type: 'change', payload: newVal });
    },
    tools(newVal) {
      if (newVal.length) {
        this.toolbar = newVal.map((tool) => {
          if (tool && tool.name) {
            return {
              ...this.toolDefaultConfig[tool.name],
              click: tool.callback,
            };
          }
          return null;
        }).filter(tool => tool);
      }
    },
  },
};
</script>

<style lang="scss">
#fc-editor {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  .editor-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    > div {
      position: relative;
      width: 100%;
    }
    .native-editor {
      padding: 0 2px;
    }
  }
  .DraftEditor-editorContainer{
    .public-DraftStyleDefault-block{
      span[data-text=true]{
        padding-bottom: 1px;
      }
    }
  }
}
</style>
