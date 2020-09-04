/* eslint-disable */ 
import lodash from 'lodash';
import AvatarCache from '@/utils/avatar-cache';
import emitter from '@/utils/event-emitter';
import { ALL_MEMBERS } from '../constants';
import { mapState } from 'vuex';

const ENABLE_CHAT_RECORD = false;

const mentionOption = {
  width: 180,
  height: 34,
  enableAvatar: true,
};
const commandOption = {
  width: 338,
  height: 45,
  enableAvatar: false,
};

export default {
  data() {
    return {
      suggestions: [],
      suggestionOption: mentionOption,
      suggestionSelectedBot: undefined,
      INPUT_EMOJI_DEFAULT: require("../../../../assets/images/input_emoji_default.svg"),
      INPUT_EMOJI_DEFAULT_HOVER: require("../../../../assets/images/input_emoji_hover.svg"),
      INPUT_FILE_DEFAULT: require("../../../../assets/images/input_file_default.svg"),
      INPUT_FILE_DEFAULT_HOVER: require("../../../../assets/images/input_file_hover.svg"),
    };
  },
  computed: {
    ...mapState({
      roles: state => state.userInfo && state.userInfo.roles,
    }),
    disabledEditor() {
      return !this.viewingRoom.isDirect && (this.isBanAll || !!this.viewingRoom.isArchiveChannel);
    },
    disabledEditorMessage() {
      return this.viewingRoom.isArchiveChannel ? '频道已被归档' : '全员禁言中';
    },
    tools() {
      const tools = [{
        name: 'EMOTICON',
        icon: this.INPUT_EMOJI_DEFAULT,
        iconHover: this.INPUT_EMOJI_DEFAULT_HOVER,
        callback: name => this.handleEditorToolClick(name),
      }, {
        name: 'FILE',
        icon: this.INPUT_FILE_DEFAULT,
        iconHover: this.INPUT_FILE_DEFAULT_HOVER,
        callback: name => this.handleEditorToolClick(name),
      }, 
    //   {
    //     name: 'CAPTURE',
    //     callback: name => this.handleEditorToolClick(name),
    //   }
    ];
      if (!this.viewingRoom.isBot && this.viewingRoom.isDirect && this.hasVoiceCall) {
        tools.push({
          name: 'AUDIO_CALL',
          callback: () => this.handleCall('voice'),
        });
        tools.push({
          name: 'VIDEO_CALL',
          callback: () => this.handleCall('video'),
        });
      }
      const role = this.roles ? this.roles.reduce((pre, cur) => {
        if (pre.name === 'super' || cur.name === 'super') return 'super';
        if (pre.name === 'fin_supervisor' || cur.name === 'fin_supervisor') return 'fin_supervisor';
        if (pre.name === 'trader' || cur.name === 'trader') return 'trader';
        return 'fin_worker';
      }, '') : '';
      // console.log('role:', role);
      if (role === 'trader') {
        tools.push({
          name: 'BIM',
          callback: () => {
            if (window.finstation) {
              window.finstation.addons.launch({
                name: 'BIM',
                id: 'com.finogeeks.personal.bim',
                disableNavigationBar: true,
                url: `${VIEW_BIM}?room_id=${this.roomId}`,
                width: 500,
                height: 436,
                powerLevel: 5,
                type: 'window',
              });
            }
          },
        });
      }

      if (ENABLE_CHAT_RECORD) {
        tools.push({
          name: 'RECORD',
          callback: async () => {
            if (window.finstation) {
              let roomInfor = window.onGetRoom({roomId: this.roomId});
              if(roomInfor.isEncryped === 1) {
                this.$Message.warning("端到端加密信息不支持搜索");
                return;
              };
              // 重写逻辑
              window.finstation.sendMessage(undefined, 'OPEN_CHAT_RECORD', {
                roomName: this.rawRoom.name,
                roomId: this.roomId
              }, 'webview');
              window.finstation.addons.launch({
                name: `聊天记录-${this.rawRoom.name}`,
                id: 'com.finogeeks.personal.chatRecord',
                disableNavigationBar: true,
                single: true,
                url: VIEW_CHAT_RECORD,
                width: 700,
                height: 620,
                frame: false,
                powerLevel: 5,
                type: 'window',
                meta: {
                  roomName: this.rawRoom.name,
                  roomId: this.roomId
                }
              });
            }
          }
        })
      }

      if (this.viewingRoom.isServiceRoom) {
        tools.push({
          name: 'EVALUATE',
          callback: async () => {
            const topicEvent = this.rawRoom.currentState.getStateEvents('m.room.topic', '');
            const custService = JSON.parse(topicEvent.event.content.topic).custService;
            try {
              const authInfo = this.$store.state.authInfo;
              const { data: orderInfo } = await this.$http({
                method: 'GET',
                url: `/api/v1/swan/bot/dispatch/${custService.orderId}/brief?jwt=${authInfo.api_token}&access_token=${authInfo.access_token}`,
              });
              const { orderStatus } = orderInfo;
              /**
               * 工单状态有
               *
               * 0.未分配
               * 1.已分配（还没人接单）
               * 2.进行中
               * 3.已结束（已结束未评价）
               * 4.已评价（已结束已评价）
               * 5.已取消
               * 6.接单超时
               * 7.处理超时
               * 8.转单中
              */
              // console.log('orderInfo', orderInfo);
              if (custService.isClosed === true) {
                this.$Message.error('该状态无法发起评价');
                return;
              }
              await this.$http({
                method: 'PUT',
                url: `/api/v1/swan/bot/dispatch/evalmsg?jwt=${authInfo.api_token}&access_token=${authInfo.access_token}`,
                data: {
                  orderId: custService.orderId,
                  dispatchPattern: 'B',
                  appType: 'STAFF',
                  staffId: custService.staffId,
                  roomId: this.rawRoom.roomId,
                },
              });
              await this.$http({
                method: 'POST',
                url: `/api/v1/swan/bot/dispatch/close?jwt=${authInfo.api_token}&access_token=${authInfo.access_token}`,
                data: {
                  orderId: custService.orderId,
                  pattern: 'B',
                  retailId: custService.retailId,
                  staffId: custService.staffId,
                  roomId: this.rawRoom.roomId,
                },
              });
            } catch (err) {
              this.$Message.error('发起评价失败');
              console.log(err);
            }
          },
        });
        tools.push({
          name: 'TRANSFER',
          callback: async () => {
            const topicEvent = this.rawRoom.currentState.getStateEvents('m.room.topic', '');
            const custService = JSON.parse(topicEvent.event.content.topic).custService;
            const authInfo = this.$store.state.authInfo;
            const { data: orderInfo } = await this.$http({
              method: 'GET',
              url: `/api/v1/swan/bot/dispatch/${custService.orderId}/brief?jwt=${authInfo.api_token}&access_token=${authInfo.access_token}`,
            });
            const { orderStatus } = orderInfo;
            /**
             * 工单状态有
             *
             * 0.未分配
             * 1.已分配（还没人接单）
             * 2.进行中
             * 3.已结束（已结束未评价）
             * 4.已评价（已结束已评价）
             * 5.已取消
             * 6.接单超时
             * 7.处理超时
             * 8.转单中
            */
            // console.log('orderInfo', orderInfo);
            if (custService.isClosed === true) {
              this.$Message.error('该状态无法发起转单');
              return;
            }
            emitter.once('SERVICE_TRANSFER', (type, meta) => {
              // console.log(data);
              this.$store.commit('RESET_MODAL');
              if (meta.data.msg === 'success') {
                this.$Message.success('转单成功');
              } else if (meta.data.msg === 'error') {
                this.$Message.error('转单不成功');
              }
            });
            this.$store.commit('CREATE_MODAL', {
              type: 'transfer',
              meta: {
                createType: 'transfer',
                custService,
                authInfo,
                callback: {
                  type: 'event',
                  event: 'SERVICE_TRANSFER',
                  id: 'service-transfer',
                  from: 'service-transfer',
                },
              },
            });
          },
        });
      }

      return tools;
    },
    textValue() {
      return this.changeValue.text;
    },
    commandMode() {
      return this.isBot(this.suggestionSelectedBot) && /^(@)([^@])+(\s)$/.test(this.textValue);
    },
  },
  methods: {
    getRole() {

    },
    handleEditorToolClick(name) {
      if (this.isBanAll) {
        this.$Message.error('全员禁言中');
        return;
      }
      if (this.viewingRoom.isArchiveChannel) {
        this.$Message.error('频道已被归档');
        return;
      }
      switch (name) {
        case 'CAPTURE':
          this.handleCapture();
          break;
        default:
          break;
      }
    },
    handleCapture: lodash.throttle(function () { // eslint-disable-line
      if (typeof window.finstation !== 'object') {
        return;
      }
      window.finstation.sendMessage('GET_WIN_EVN', 'CAPTURE');
      window.finstation.sendMessage('SCREENSHOT');
    }, 2000, { leading: true }),
    async handleCall(type) {
      const response = await this.$matrix.createCall(this.roomId, type);
      if (!response.status) {
        this.$Message.warning(response.data.error || '拨打失败');
      }
    },
    getFilteredMembers(term = '') {
      let filteredMembers = [];
      if (!term) {
        filteredMembers = [ALL_MEMBERS].concat(this.peerMembers);
      } else {
        filteredMembers = this.peerMembers.filter((member) => {
          const match = member.userId.split(':');
          const userId = match[0].substring(1);
          return member.rawDisplayName.indexOf(term) > -1
          || userId.indexOf(term) > -1;
        });
      }
      return filteredMembers;
    },
    handleSearchMention(trigger = '@', term = '') {
      if (!this.viewingRoom.isDirect && trigger === '@') {
        const filteredMembers = this.getFilteredMembers(term);
        if (filteredMembers.length) {
          return filteredMembers.map((item) => {
            if (item.userId === '@all') {
              return {
                id: item.userId,
                name: item.rawDisplayName.trim(),
                icon: 'static/assets/room_avatar_all.svg',
              };
            }
            const user = this.$matrix.matrixClient.getUser(item.userId);
            return {
              id: item.userId,
              name: user.displayName.trim() || item.rawDisplayName.trim() || item.userId,
              icon: this.$matrix.mxcTransfer(user.avatarUrl) || this.$matrix.mxcTransfer(item.avatar),
            };
          });
        }
      }
      return [];
    },
    handleEditorEvent(event) {
      // console.log('HANDLEEDITOREVEN');
      const { type, payload } = event;
      // console.log(type);
      // console.log(payload);
      switch (type) {
        case 'send':
          this.handleSend(payload);
          break;
        case 'upload':
          this.handleUpload(payload);
          break;
        case 'change':
          this.changeValue = payload;
          if (!payload.text) {
            this.suggestions = [];
          }
          // this.viewingRoom.roomEditingMsg = payload.text;
          // console.log(this.roomList);
          // this.$store.commit('updateRoomList', this.viewingRoom);
          // this.$emit('editTextChange', payload.text);
          this.editingMsg = payload.text;
          break;
        default:
          console.log(type);
          console.log(payload);
          break;
      }
      // console.log(this.viewingRoom.roomEditingMsg);
      this.timeLineFix = false;
    },
    handleEditorTrigger({ trigger, term }) {
      if (!term && !trigger) {
        return;
      }
      this.suggestionOption = mentionOption;
      this.suggestions = this.handleSearchMention(trigger, term);
    },
    handleEditorSuggestionClick({ index, id, value }) {
      // Use concat this string here because the appendText is async
      const newTextValue = `${this.textValue}${value} `;
      if (this.commandMode) {
        // Insert into editor
        this.$refs.editor.appendText(`${value} `);
      } else {
        this.insertSignal(id, value);
      }
      // Fetch next command
      if (this.isBot(id)) {
        this.suggestionSelectedBot = id;
      }
      if (this.suggestionSelectedBot) {
        this.fetchCommands(this.suggestionSelectedBot, newTextValue);
      }
    },
    handleEditorTextClick(action) {
      console.log(action);
    },
    insertSignal(id, value) {
      this.$refs.editor.insertSignal('@', id, value);
      this.suggestions = [];
    },
    async fetchCommands(userId, value) {
      this.suggestions = [];
      // split to array and remove empty string element
      const params = value.split(' ').filter(param => !!param);
      // remove the fisrt @bot
      params.shift();
      const commands = await this.$fcFinbot.fetchCommands(userId, params);
      if (commands && commands.length) {
        this.suggestionOption = commandOption;
        this.suggestions = commands.map(command => ({
          id: `${command.name}-${Date.now()}`,
          ...command,
        }));
        this.suggestionSelectedBot = userId;
      } else {
        this.suggestionSelectedBot = undefined;
      }
    },

    // Helpers
    isBot(userId) {
      return /^(.+)(-bot)(.+)$/.test(userId);
    },
  },
  watch: {
    suggestions(newVal) {
      this.$refs.editor.handleIgnoreEnter(!!newVal.length);
    },
  },
};
