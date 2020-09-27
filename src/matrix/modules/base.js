import emojione from 'emojione';
import moment from 'moment';
import sdk, { FinChatNormal } from '@finogeeks/matrix-js-sdk';
import { ChannelService } from '@/utils/channel';
import { IAM_INFO_KEY, RoomType } from '@/commonVariable';
import { last as _last } from 'lodash';
import { Message } from '@finogeeks/finchat-model';

import { AVATAR_SIZE, FILTER_DEFINITION } from '../config';
export default class BaseModule {
  constructor(mxClient, opts) {
    this.mxClient = mxClient;
    this.baseUrl = opts.baseUrl || window.location.origin;
    this.deviceId = opts.deviceId;
    this.accessToken = opts.accessToken;
    this.jwtToken = opts.apiToken;
    this.userId = opts.userId;
    this.mxSdk = sdk;
    this.fcApis = new FinChatNormal();
    this.$fcChannel = new ChannelService();
    const myinfo = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY));
    this.$fcChannel.init(
      '',
      myinfo.user_id,
      myinfo.jwt,
      myinfo.access_token,
    );
  }

  // QQ房间会覆盖这个方法
  async buildRoom(mxRoom) {
    if (!mxRoom) return null;
    const roomState = mxRoom.currentState;
    const createEvent = roomState.getStateEvents('m.room.create', '');
    const memberEvent = roomState.getStateEvents('m.room.member', this.userId);
    const topicEvent = roomState.getStateEvents('m.room.topic', '');
    const historyEvent = roomState.getStateEvents('m.room.history_visibility', '');
    const powerEvent = roomState.getStateEvents('m.room.power_levels', '');
    const nameEvent = roomState.getStateEvents('m.room.name', '');
    const joinRuleEvent = roomState.getStateEvents('m.room.join_rules', '');
    const archiveEvent = roomState.getStateEvents('m.room.archive', '');
    const baseUrl = this.baseUrl;
    const roomId = mxRoom.roomId;
    const me = roomState.getMember(this.userId);
    // 非法房间返回 null
    if (!createEvent) {
      return {};
    }
    const content = createEvent.event.content || {};
    const rawTopic = topicEvent && topicEvent.event && topicEvent.event.content ? topicEvent.event.content.topic : '';
    const roomRule = this.mxClient.getRoomPushRule('global', roomId);

    const isDirect = content.is_direct ? 1 : 0;
    const isBot = content.is_bot ? 1 : 0;
    const members = roomState.getMembers().map(mxMember => this.buildRoomMember(mxMember));
    const membership = (me && me.membership) || '';
    const isSecret = content.is_secret ? 1 : 0;
    const isEncryped = this.mxClient.isRoomEncrypted(roomId) ? 1 : 0;
    const isChannel = content.is_channel ? 1 : 0;
    let isArchiveChannel = archiveEvent && archiveEvent.event && archiveEvent.event.content && archiveEvent.event.content.archive; // TODO channel相关的信息在原版build中是异步的 需要优化一下
    let isPrivateChannel = 0; // TODO channel相关的信息在原版build中是异步的 需要优化一下
    const enableForward = content.enable_forward ? 1 : 0;
    const enableFavorite = content.enable_favorite ? 1 : 0;
    const enableSnapshot = content.enable_snapshot ? 1 : 0;
    const enableWatermark = content.enable_watermark ? 1 : 0;
    const unread = mxRoom.getUnreadNotificationCount('total') || 0;
    // const highlight = mxRoom.getUnreadNotificationCount('highlight') || 0; // TODO @消息需要改用alert事件 所以先去掉highlist字段
    const highlight = 0;
    const powerLevel = (me && me.powerLevel) || 0;
    const power = this.buildPower(powerEvent);
    const groupAvatars = []; // TODO build groupAvatars
    const historyVisibility = (historyEvent && historyEvent.event && historyEvent.event.content && historyEvent.event.content.history_visibility) ? historyEvent.event.content.history_visibility : 'shared';
    const isTop = mxRoom.tags['m.favourite'] ? 1 : 0;
    const createTime = createEvent.event.origin_server_ts;
    const createrId = createEvent.event.sender;
    const lastMessage = this.getLastMessage(mxRoom, isDirect);
    const lastUpdateTime = (lastMessage && lastMessage.eventTime) || 0;
    const draftMessage = null; // TODO draftMessage
    const typingCount = 0;
    const joinRule = (joinRuleEvent && joinRuleEvent.event && joinRuleEvent.event.content && joinRuleEvent.event.content.join_rule) ? joinRuleEvent.event.content.join_rule : 'invite';
    const isBan = power && power.default === 100 && powerLevel !== 100;
    const originalName = (nameEvent && nameEvent.event.content.name) || '';
    // 新增新的静音状态字段
    let muteStatus = 'default';
    if (roomRule && roomRule.enabled && roomRule.actions.length) {
      const { actions = [] } = roomRule;
      if (actions.indexOf('dont_notify') > -1) muteStatus = 'mute';
      if (actions.indexOf('prohibit_notify') > -1) muteStatus = 'prohibit';
      if (actions.indexOf('fold_notify') > -1) muteStatus = 'fold_mute';
    }
    const isMute = muteStatus !== 'default';
    // const isMute = (roomRule && roomRule.enabled && roomRule.actions.length === 1 && roomRule.actions[0] === 'dont_notify') ? 1 : 0;
    let isDelete = mxRoom.tags.delete ? 1 : 0;
    const isHide = mxRoom.tags.hide ? 1 : 0;


    const totlaunread = mxRoom.getUnreadNotificationCount('total') || 0;
    const highlightunread = mxRoom.getUnreadNotificationCount('highlight') || 0;

    let roomTopic = ''; // TODO buildRoomTopic 方法抽离
    try {
      roomTopic = JSON.parse(rawTopic).topic;
    } catch (e) {
      roomTopic = rawTopic;
    }

    let isServiceRoom = 0; // TODO buildServiceRoom 方法抽离
    let isServiceClosed = 0;
    try {
      const custService = JSON.parse(rawTopic).custService;
      if (custService && custService.type === 'dispatch') {
        isServiceRoom = 1;
        isServiceClosed = custService.isClosed ? 1 : 0;
      }
    } catch (e) { }

    let name = ''; // TODO 原来的build中直聊房间有些信息是异步从profile接口拿的，要改掉 ，主要是 peerMemberProfile对象
    let avatar = '';
    if (isDirect) {
      const peerMember = members.find(member => (member && member.userId) !== this.userId) || {};
      const user = this.mxClient.getUser(peerMember.userId) || {};
      name = user.displayName || originalName || '群聊';
      avatar = this.mxcTransfer(peerMember.avatarUrl || '');
    } else {
      name = originalName || `${members.length < 2 ? '群聊' : members.map((m) => {
        if (!m) return {};
        const user = this.mxClient.getUser(m.userId) || {};
        return user.displayName || m.rawDisplayName || m.userId;
      }).join('、')}`;
      avatar = this.mxcTransfer(mxRoom.getAvatarUrl(baseUrl, 60, 60, 'scale', false) || '');
    }
    if (isChannel) {
      isArchiveChannel = (archiveEvent && archiveEvent.event && archiveEvent.event.content && archiveEvent.event.content.archive) ? archiveEvent.event.content.archive : isArchiveChannel;
      if (!isDelete) {
        isDelete = isArchiveChannel;
      }
      const res = await this.$fcChannel.getChannelDetail({ roomId });
      // // console.log('isPrivateChannel');
      // // console.log(res);
      if (res.status) {
        isPrivateChannel = res.data.preset === 'private_chat';
      }
    }
    const { roomType } = this.getRoomMeta(mxRoom);
    return {
      roomId,
      roomType,
      isDirect,
      isBot,
      name,
      membership,
      members,
      groupAvatars,
      isMute,
      isDelete,
      isHide,
      isSecret,
      isEncryped,
      isChannel,
      isPrivateChannel,
      isArchiveChannel,
      isServiceRoom,
      isServiceClosed,
      enableForward,
      enableFavorite,
      enableSnapshot,
      enableWatermark,
      roomTopic,
      unread,
      highlight,
      powerLevel,
      avatar,
      historyVisibility,
      isTop,
      lastUpdateTime,
      createTime,
      createrId,
      typingCount,
      power,
      lastMessage,
      draftMessage,
      joinRule,
      isBan,
      totlaunread,
      highlightunread,
      muteStatus,
    };
  }

  getRoomMeta(mxRoom) {
    const roomState = mxRoom.currentState;
    const topicEvent = roomState.getStateEvents('m.room.topic', '');
    let topicData = null;
    const originTopicData = topicEvent ? topicEvent.event.content.topic : '';
    try {
      if (typeof originTopicData === 'string') {
        topicData = JSON.parse(originTopicData);
      } else {
        topicData = originTopicData;
      }
    } catch (error) {
      topicData = null;
    }
    const mxMembers = mxRoom.getJoinedMembers();

    // const members: User[] = mxMembers.map(mxUser => this.getLocalUser(mxUser.userId)).filter(user => !!user)
    // let roomName = mxRoom.name;
    // let roomAvatar = mxRoom.getAvatarUrl(this.baseUrl, 60, 60, 'scale', false);
    // // console.log(roomAvatar);
    // let avatarUserIds = []; // 提供头像的用户id
    // let isOnline = true;
    // let orderInfo = {};
    let roomType = RoomType.channel;
    let topicMsg = '';

    if (!topicData) {
      // avatarUserIds = members.slice(0, 4).map(member => member.id);
      return {
        // roomName,
        // avatarUserIds,
        // roomAvatar,
        // isOnline,
        // orderInfo,
        roomType,
        // topicMsg,
        // members,
        // topic: null,
      };
    }

    topicMsg = topicData.topic || '';

    const { custService, botId, swanBotType } = topicData;
    // // console.log(topicData);
    // 投顾房间
    if (custService && custService.type == 'dispatch' && custService.staffId) {
      // const staffInfo = this.getLocalUser(custService.staffId);
      // // // console.log('meta staffInfo', staffInfo);
      // orderInfo = { ...custService };
      // roomName = staffInfo.name;
      // roomAvatar = staffInfo.avatar;
      // isOnline = staffInfo.isOnline;
      roomType = RoomType.advisor;
      // avatarUserIds.push(custService.staffId);

      // 派单房间
    } else if (custService && custService.type == 'dispatch') {
      // orderInfo = { ...custService };
      roomType = RoomType.dispatch;

      // 智能客服房间
    } else if (botId && swanBotType === 'smart') {
      roomType = RoomType.smartBot;
      // avatarUserIds.push(botId);

      // 普通机器人房间
    } else if (botId) {
      // avatarUserIds.push(botId);
      roomType = RoomType.normalBot;

      // 频道房间
    } else {
      // avatarUserIds = members.slice(0, 4).map(member => member.id);
    }

    if (botId) {
      // const botInfo = this.getLocalUser(botId);
      // roomAvatar = botInfo.avatar;
      // roomName = botInfo.name;
      // avatarUserIds = [botId];
    }

    return {
      // roomName,
      // avatarUserIds,
      // roomAvatar,
      // isOnline,
      // orderInfo,
      roomType,
      // topicMsg,
      // members,
      // topic: topicData,
    };
  }

  // 获取缩略图的地址
  mxcTransfer(mxcUrl, mode = 'raw', width = AVATAR_SIZE, height = AVATAR_SIZE) {
    if (!mxcUrl) {
      return '';
    }
    const trimUrl = mxcUrl.trim();
    let url = '';
    if (trimUrl.startsWith('mxc')) {
      const params = mode === 'raw' ? [trimUrl] : [trimUrl, width, height, mode];
      url = this.mxClient.mxcUrlToHttp(...params);
    } else if (trimUrl.startsWith('http') || trimUrl.startsWith('blob')) {
      url = trimUrl;
    } else if (mode === 'raw') {
      // console.log('mode === row');
      const userSession = JSON.parse(localStorage.getItem('Model:iam-info'));
      // // console.log(JSON.parse(userSession));
      // url = this.mxClient.mxcUrlToHttp(trimUrl);
      url = `${this.baseUrl}/api/v1/netdisk/download/${mxcUrl}?access_token=${userSession.access_token}&jwt=${userSession.jwt}`;
      // url = url.replace(/\/\//g, '/')
    } else {
      // console.log('getThumbnailUrl');
      url = this.fcApis.getThumbnailUrl(trimUrl);
    }
    return url;
  }

  buildPower(powerEvent) {
    if (!powerEvent || !powerEvent.event) { return null; }
    const mxPower = powerEvent.event.content;
    if (!mxPower) { return null; }
    return {
      default: mxPower.events_default,
      inviteUser: mxPower.invite,
      kickUser: mxPower.kick,
      redactUser: mxPower.invite,
      banUser: mxPower.ban,
      setAvatar: mxPower.events && mxPower.events['m.room.avatar'] ? mxPower.events['m.room.avatar'] : mxPower.state_default,
      setHistoryVisibility: mxPower.events && mxPower.events['m.room.history_visibility'] ? mxPower.events['m.room.history_visibility'] : mxPower.state_default,
      setName: mxPower.events && mxPower.events['m.room.name'] ? mxPower.events['m.room.name'] : mxPower.state_default,
      setPowerLevel: mxPower.events && mxPower.events['m.room.power_levels'] ? mxPower.events['m.room.power_levels'] : mxPower.state_default,
      sendMessage: mxPower.events && mxPower.events['m.room.message'] ? mxPower.events['m.room.message'] : mxPower.events_default,
    };
  }

  getLastMessage(mxRoom, isDirect) {
    const membership = (mxRoom.getMyMembership && mxRoom.getMyMembership()) || '';
    if (!membership) {
      return {};
    }
    if (membership === 'invite') {
      const memberEvent = mxRoom.currentState.getStateEvents('m.room.member', mxRoom.myUserId);
      return this.buildInviteMessage(memberEvent, mxRoom);
    }
    const timeline = mxRoom.timeline;

    const { messages } = this.goThroughTimeLine(timeline);
    const filterMessages = messages.filter((message) => {
      const clearEvent = message._clearEvent.content ? message._clearEvent : message.event;
      const isCallEvent = this.isCallEvent(clearEvent.type);
      if (!isCallEvent && clearEvent.type !== 'm.room.message' && !message.event.hint) {
        return false;
      }

      if (isCallEvent) {
        const reason = clearEvent.content.reason;
        const info = clearEvent.content.info;
        if (!info && !reason) {
          return false;
        }
        return true;
      } else if (FILTER_DEFINITION.room.timeline.types.includes(clearEvent.type)) {
        return true;
      }
      return false;
    });
    const lastMsg = _last(filterMessages);
    if (lastMsg) {
      return this.buildMessage(lastMsg, mxRoom, isDirect);
    }
  }

  isCallEvent(type) {
    return type.startsWith('m.call');
  }

  goThroughTimeLine(timeline) {
    const result = [];
    timeline.forEach((mxEvent) => {
      if (!mxEvent || !mxEvent.event) {
        return;
      }
      const isEncrypted = mxEvent.event.type === 'm.room.encrypted';
      const clearEvent = isEncrypted ? mxEvent._clearEvent : mxEvent.event;
      if (FILTER_DEFINITION.room.timeline.types.includes(clearEvent.type)) {
        result.push(mxEvent);
      }
    });

    return {
      messages: result,
      startMessage: result[0],
      lastMessage: result[result.length - 1],
    };
  }

  buildInviteMessage(messageEvent, mxRoom) {
    if (mxRoom.getMyMembership() !== 'invite') {
      return {};
    }
    const sender = (messageEvent && messageEvent.event.sender) || '';
    const inviter = mxRoom.currentState.getMember(sender) || {};
    return {
      msgType: 'notice',
      msgTypeInfo: '',
      msgBody: `${inviter.rawDisplayName || inviter.name || inviter.userId}向你发起了加入邀请`,
      eventId: messageEvent.event.event_id,
      status: 'sent',
      eventTime: messageEvent.event.origin_server_ts,
    };
  }

  // 房间timeline的消息实体
  buildTimelineMessage(messageEvent, mxRoom) {
    if (mxRoom.roomId === '!134034672198877184:finogeeks.club') {
      console.log('messageEvent', messageEvent);
    }
    const clearEvent = messageEvent._clearEvent.content ? messageEvent._clearEvent : messageEvent.event;
    const sender = messageEvent.sender || mxRoom.getMember(messageEvent.event.sender) || {};
    const eventId = messageEvent.event.event_id;

    const eventType = clearEvent.type;
    const eventTime = messageEvent.event.origin_server_ts || Date.now();

    let status = '';
    let content = {};

    switch (messageEvent.status) {
      case 'encrypting':
      case 'sending':
      case 'queued':
        status = 'sending';
        break;
      case 'not_sent':
        status = 'error';
        break;
      case 'sent':
      case null:
        status = 'success';
        break;
      default:
        break;
    }
    let msgType = '';
    let msgTypeInfo = '';
    const user = this.mxClient.getUser(sender.userId);
    if (!user) return {};
    let msgBody = '';
    if (eventType === Message.types.message) {
      msgType = clearEvent.content.msgtype;
      switch (msgType) {
        case Message.types.text: {
          msgBody += clearEvent.content.body;
          break;
        }
        case Message.types.alert:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.signal:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.convo:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.image:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += '[图片]';
          }
          break;
        case Message.types.video:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += '[视频]';
          }
          break;
        case Message.types.audio:
          msgBody += '[语音]';
          break;
        case Message.types.file:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += `[文件] ${clearEvent.content.body}`;
          }
          break;
        case Message.types.location:
          msgBody += '[位置]';
          break;
        case Message.types.url:
          msgBody += '[链接] ';
          msgBody += `${clearEvent.content.info && (clearEvent.content.info.title || clearEvent.content.info.description)}`;
          break;
        case Message.types.businesscard:
          msgBody += '[个人名片]';
          break;
        case Message.types.badEncrypted:
        case Message.types.eventEncrypted:
          msgBody += '[无法解析的加密消息]';
          break;
        case Message.types.notice:
          msgBody = clearEvent.content.body;
          break;
        case Message.types.call:
          break;
        case 'fc.applet':
          msgTypeInfo = '[小程序]';
          break;
        case Message.types.unknown:
          msgBody += '[暂不支持展示该消息类型]';
          break;
        // case Message.types.roomRedaction:
        //   msgBody += '哈哈哈哈';
        //   break;
        default:
          msgBody += '[暂不支持展示该消息类型]';
          break;
      }
      content = {
        msgType,
        msgTypeInfo,
        sender: user.displayName,
        msgBody: emojione.unicodeToImage(msgBody),
        eventId,
        status,
        eventTime,
        senderId: sender.userId,
      };
    } else if (eventType === Message.types.call) {
      const info = clearEvent.content.info;
      const reason = clearEvent.content.reason;

      const isVideoCall = info && info.isVideoCall === '1';
      if (!info && !reason) {
        msgBody = '';
      } else if (reason) {
        msgBody = '未接通';
      } else {
        const duration = parseInt(info.duration, 10);
        if (duration) {
          const temp = moment.utc(duration);
          msgBody = `通话时长${duration > 3600 * 1000 ? temp.format('HH:mm:ss') : temp.format('mm:ss')}`;
        } else if (messageEvent.event.sender === this.userId) {
          msgBody = '已取消';
        } else {
          msgBody = '对方已取消';
        }
      }
      if (isVideoCall) {
        msgBody = `[视频通话] ${msgBody}`;
      } else {
        msgBody = `[语音通话] ${msgBody}`;
      }
      content = {
        msgType,
        msgTypeInfo,
        msgBody,
        eventId,
        status,
        eventTime,
      };
    } else {
      msgType = 'notice';
      msgBody = this.getNoticeMsgBody(messageEvent);
      content = {
        msgType,
        msgTypeInfo,
        sender: user.displayName,
        msgBody: msgBody ? emojione.unicodeToImage(msgBody) : '',
        eventId,
        status,
        eventTime,
      };
    }
    let isRedacted;
    if (messageEvent.isRedacted()) {
      isRedacted = true;
    }
    const { content: oriContent, event_id, origin_server_ts, room_id, type, user_id, state_key } = messageEvent.event; // eslint-disable-line
    // content.users = oriContent.users;
    return {
      content: Object.assign({}, oriContent, content),
      eventId: event_id,
      time: origin_server_ts,
      roomId: room_id,
      sender: sender.userId || user_id,
      type,
      status,
      state_key,
      msgType,
      msgTypeInfo,
      isRedacted,
      redacts: clearEvent.redacts,
    };
  }

  // 用于房间列表最新消息展示用的消息实体 TODO 收拾一下！
  buildMessage(messageEvent, mxRoom, isDirect) {
    const clearEvent = messageEvent._clearEvent.content ? messageEvent._clearEvent : messageEvent.event;
    const sender = messageEvent.sender || mxRoom.getMember(messageEvent.event.sender) || {};
    const eventId = messageEvent.event.event_id;

    const eventType = clearEvent.type;
    const eventTime = messageEvent.event.origin_server_ts || Date.now();

    let status = '';

    switch (messageEvent.status) {
      case 'encrypting':
      case 'sending':
      case 'queued':
        status = 'sending';
        break;
      case 'not_sent':
        status = 'error';
        break;
      case 'sent':
      case null:
        status = 'success';
        break;
      default:
        break;
    }
    let msgType = '';
    let msgTypeInfo = '';
    const user = this.mxClient.getUser(sender.userId);
    if (!user) return {};
    let msgBody = '';
    if (eventType === Message.types.message) {
      // console.log('buildMessage');
      msgType = clearEvent.content.msgtype;
      // console.log(clearEvent.content);
      // console.log(msgType);
      switch (msgType) {
        case Message.types.text: {
          msgBody += clearEvent.content.body;
          break;
        }
        case Message.types.alert:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.signal:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.convo:
          msgBody += clearEvent.content.body;
          break;
        case Message.types.image:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += '[图片]';
          }
          break;
        case Message.types.video:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += '[视频]';
          }
          break;
        case Message.types.audio:
          msgBody += '[语音]';
          break;
        case Message.types.file:
          if (clearEvent.content.flag) {
            msgBody += '[保密消息]';
          } else {
            msgBody += `[文件] ${clearEvent.content.body}`;
          }
          break;
        case Message.types.location:
          msgBody += '[位置]';
          break;
        case Message.types.url:
          msgBody += '[链接] ';
          msgBody += `${clearEvent.content.info && (clearEvent.content.info.title || clearEvent.content.info.description)}`;
          break;
        case Message.types.businesscard:
          msgBody += '[个人名片]';
          break;
        case Message.types.badEncrypted:
        case Message.types.eventEncrypted:
          msgBody += '[无法解析的加密消息]';
          break;
        case Message.types.notice:
          console.log('Message.types.notice');
          console.log(clearEvent);
          msgBody = clearEvent.content.body;
          break;
        case Message.types.call:
          break;
        case 'fc.applet':
          msgTypeInfo = '[小程序]';
          break;
        case Message.types.unknown:
        default:
          if (clearEvent.hint && clearEvent.hint.endsWith && clearEvent.hint.endsWith('撤回了一条消息')) {
            msgType = 'redact';
            msgBody = clearEvent.hint;
          } else if (!clearEvent.hint && clearEvent.unsigned && clearEvent.unsigned.redacted_because) {
            msgType = 'redact';
            let hint;
            const senderId = clearEvent.sender;
            if (senderId === this.userId) {
              hint = '你撤回了一条消息';
            } else {
              const senderMxUser = this.mxClient.getUser(senderId);
              hint = `${(senderMxUser && senderMxUser.displayName) || senderId}撤回了一条消息`;
            }
            msgBody = hint;
          } else {
            msgBody += '[暂不支持展示该消息类型]';
          }
          break;
      }
      return {
        msgType,
        msgTypeInfo,
        sender: user.displayName,
        msgBody,
        eventId,
        status,
        eventTime,
        senderId: sender.userId,
      };
    } else if (eventType === Message.types.call) {
      const info = clearEvent.content.info;
      const reason = clearEvent.content.reason;

      const isVideoCall = info && info.isVideoCall === '1';
      if (!info && !reason) {
        msgBody = '';
      } else if (reason) {
        msgBody = '未接通';
      } else {
        const duration = parseInt(info.duration, 10);
        if (duration) {
          const temp = moment.utc(duration);
          msgBody = `通话时长${duration > 3600 * 1000 ? temp.format('HH:mm:ss') : temp.format('mm:ss')}`;
        } else if (messageEvent.event.sender === this.userId) {
          msgBody = '已取消';
        } else {
          msgBody = '对方已取消';
        }
      }
      if (isVideoCall) {
        msgBody = `[视频通话] ${msgBody}`;
      } else {
        msgBody = `[语音通话] ${msgBody}`;
      }
      return {
        msgType,
        msgTypeInfo,
        msgBody,
        eventId,
        status,
        eventTime,
      };
    } else if (eventType === Message.types.member) {
      // console.log('elseeeee~~~', eventType);
      // console.log(clearEvent);
      // console.log(messageEvent);
    }
    msgType = 'notice';
    msgBody = this.getNoticeMsgBody(messageEvent);
    return {
      msgType,
      msgTypeInfo,
      sender: user.displayName,
      msgBody: msgBody || '',
      eventId,
      status,
      eventTime,
    };
  }

  getNoticeMsgBody(msgEvent) {
    const message = msgEvent.event;
    let res = '';
    if (message.hint) {
      res = message.hint;
    }
    if (message.content && message.content.msgtype === 'm.notice') {
      res = message.content.body;
    }
    res = res.replace(/\$\{(.*?)\}/g, (userId, pureId) => {
      const user = this.mxClient.getUser(pureId) || {};
      return user.displayName;
    });
    return res;
  }

  buildRoomMember(mxMember) {
    if (!mxMember || !mxMember.userId) {
      // console.log('!mxMember');
      return null;
    }
    const mxUser = this.mxClient.getUser(mxMember && mxMember.userId);
    if (!mxUser) {
      // console.log('!mxUser');
      // console.log(mxMember.userId);
      return null;
    }
    return {
      userId: mxMember.userId,
      membership: mxMember.membership,
      name: mxMember.name,
      displayName: mxUser.displayName,
      rawDisplayName: mxMember.rawDisplayName,
      typing: mxMember.typing,
      powerLevel: mxMember.powerLevel,
      avatarUrl: mxUser.avatarUrl,
      presence: mxUser.presence,
    };
  }

  buildUser(mxUser) {
    if (!mxUser) return null;
    return {
      userId: mxUser.userId,
      displayName: mxUser.displayName,
      rawDisplayName: mxUser.rawDisplayName,
      presence: mxUser.presence,
      lastModified: mxUser._modified,
    };
  }

  getLastMsg(mxRoom) {
    if (!mxRoom) return null;
  }

  parseUserQQ(bfcid) {
    if (typeof bfcid !== 'string') return '';
    const matched = bfcid.match(/\d+/);
    return (matched && matched.length && matched[0]) || bfcid;
  }
}

