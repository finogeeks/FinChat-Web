import eventBridge from '@/utils/event-bridge';
import BaseModule from './base';
import emitter from '@/utils/event-emitter';
import sdk from '@finogeeks/matrix-js-sdk';

import {
  DEFAULT_ENCRYPTION_ALGORITHM,
  DB_NAME,
  AVATAR_SIZE,
  MAX_MESSAGES_SHOW,
  FILTER_DEFINITION,
} from '../config';
export default class ViewingRoomModule extends BaseModule {
  constructor(mxClient, opts) {
    super(mxClient, opts);
    this.viewingRoomSet = new Set();
    this.timelineWindowMap = new Map();
    this.init();
  }
  init() {
    this.registerEventBridge();
    this.mxClient.on('Room.timeline', this.handleTimelineEvent.bind(this));
    // console.log('VIEWINGROOM MODULE INIT END');
    // eventBridge.registerProxy('addViewingRoom', this.addViewingRoom.bind(this));
    // eventBridge.registerProxy('getTimelineMsg', this.getTimelineMsg.bind(this));
    // eventBridge.registerProxy('setReceipt', this.setReceipt.bind(this));
  }

  handleTimelineEvent(mxEvent, mxRoom, toStartOfTimeline, removed, data) {
    // console.log('Matrix.room on: Viewing-Room.timeline', mxEvent, mxRoom, toStartOfTimeline);
    // if (!this.isViewingRoom(mxRoom.roomId)) {
    //   this.addViewingRoom(mxRoom.roomId);
    // }
    if (!toStartOfTimeline && this.isViewingRoom(mxRoom.roomId)) {
      const roomId = mxRoom.roomId;
      const timelineWindow = this.timelineWindowMap.get(roomId);
      timelineWindow.paginate(this.mxSdk.EventTimeline.FORWARDS, 1, false);
      const message = this.buildTimelineMessage(mxEvent, mxRoom);
      // console.log(message);
      emitter.emit('TIMELINE_UPDATE', message, roomId);
      // eventBridge.emit(`${roomId}.NEW_MESSAGE`, message);
    }
  }

  registerEventBridge() {
    // eventBridge.on('ADD_VIEWING_ROOM', this.addViewingRoom.bind(this));
    // eventBridge.on('CANCEL_VIEWING_ROOM', this.cancelViewingRoom.bind(this));

    // in matrixClient
    // eventBridge.registerProxy('getTimelineMsg', this.getTimelineMsg.bind(this));
    // eventBridge.registerProxy('isViewingRoom', this.isViewingRoom.bind(this));

    // in RoomRender
    // eventBridge.proxy.getTimelineMsg(params)
  }

  /**
   * // TODO 已经打开的房间，存在timeline的情况下，强行定位到某一条消息可能有问题、不知道load方法是否可以多次使用，需要试一下
   *
   * @param {string} roomId 必填，房间id
   * @param {string} msgId 从哪一条消息开始, 不传默认从最新消息开始
   * @param {'BACKWORDS'|'FORWARDS'} [dir = 'BACKWORDS'] timeline方向，默认为BACKWORDS
   * @param {number} [num = 30] 消息数量，默认取30条
   * @memberof ViewingRoomModule
   */
  async getTimelineMsg(roomId, msgId, dir = 'BACKWORDS', num = 30) {
    // console.log('getTimelineMsg');
    // console.log(roomId, msgId);
    setTimeout(() => {}, 3000);
    if (!num) num = 30; // 防止ipc传参出现undefined变成null的问题
    if (this.isViewingRoom(roomId)) {
      const timelineWindow = this.timelineWindowMap.get(roomId);
      const mxRoom = this.mxClient.getRoom(roomId);
      const paginateDir = dir === 'BACKWORDS' ? this.mxSdk.EventTimeline.BACKWARDS : this.mxSdk.EventTimeline.FORWARDS;
      if (timelineWindow.canPaginate(paginateDir)) {
        // console.log('paginateDir', num);
        if (num > 30) {
          // 貌似后台接口有变，这里超过30获取不到，但可以分批获取
          const count = Math.ceil(num / 30);
          for (let i = 0; i < count; i++) {
            // console.log('~~~~~~~timelineWindow.paginate~~~~~~~', count, i);
            await timelineWindow.paginate(paginateDir, 30);
          }
        } else {
          await timelineWindow.paginate(paginateDir, num);
        }
      }
      const mxEvents = timelineWindow.getEvents();
      // console.log('mxEvents', mxEvents.length);
      // console.log('getTimelineMsg', mxEvents);
      // // console.log('getTimelineMsg :all mxEvents in timelineWindows now', mxEvents);
      const msgIdx = mxEvents.findIndex(mxEvent => mxEvent.event.event_id === msgId);
      // // console.log(msgId);
      // // console.log(msgIdx);
      if (msgIdx === -1) {
        // TODO 加判断，是timelineWindow不存在这条消息还是 真的不存在这条消息
        return mxEvents.slice(mxEvents.length - num, mxEvents.length).map(mxEvent => this.buildTimelineMessage(mxEvent, mxRoom));
      }
      if (dir === 'BACKWORDS') {
        return mxEvents.slice(msgIdx - num < 0 ? 0 : msgIdx - num, msgIdx).map(mxEvent => this.buildTimelineMessage(mxEvent, mxRoom));
      }
      if (dir === 'FORWARDS') {
        return mxEvents.slice(msgIdx + 1, msgIdx + num + 1).map(mxEvent => this.buildTimelineMessage(mxEvent, mxRoom));
      }
    }
    return [];
  }

  isViewingRoom(roomId) {
    const isViewingRoom = this.viewingRoomSet.has(roomId);
    return isViewingRoom;
  }

  async addViewingRoom(roomId, msgId = null) {
    const whetherExist = this.timelineWindowMap.get(roomId);
    if (whetherExist) {
      return;
    }
    // console.log('addViewingRoom', roomId);
    const mxRoom = this.mxClient.getRoom(roomId);
    if (!mxRoom) return;
    const totlaunread = mxRoom.getUnreadNotificationCount('total');
    this.setReceipt(roomId);
    this.viewingRoomSet.add(roomId);
    const timelineSet = mxRoom.getUnfilteredTimelineSet();
    const timelineWindow = new this.mxSdk.TimelineWindow(this.mxClient, timelineSet, { windowLimit: 100000 });
    // console.log(totlaunread);
    await timelineWindow.load(msgId, totlaunread > 9 ? totlaunread : 10);
    // await timelineWindow.paginate(this.mxSdk.EventTimeline.BACKWARDS, 10, false);
    const mxEvents = timelineWindow.getEvents();
    // console.log('ADD VIEWING ROOM');
    // console.log(mxEvents);
    this.timelineWindowMap.set(roomId, timelineWindow);
    emitter.emit('INIT_TIMELINE', roomId, mxEvents.map(mxEvent => this.buildTimelineMessage(mxEvent, mxRoom)));
  }

  // 消息已读处理
  setReceipt(roomId) {
    const mxRoom = this.mxClient.getRoom(roomId);
    if (!mxRoom) return;
    const mxEvent = mxRoom.timeline[mxRoom.timeline.length - 1];
    this.mxClient.sendReadReceipt(mxEvent);
  }

  cancelViewingRoom(roomId) {
    this.viewingRoomSet.delete(roomId);
    this.timelineWindowMap.delete(roomId);
  }

  sendMessage(roomId, content) {

  }

  addPendingMsg(roomId, content) {

  }

  updatePendingMsg(roomId, payload) {
    const { messageId, status } = payload;
  }

  removePendingMessage(roomId, payload) {
    const { messageId, status } = payload;
  }

  redactMessage(roomId, messageId) {

  }

  resendMessage(roomId, messageId) {

  }

  async loadMoreMessage(payload) {
    // console.log('LOAD MORE MESSAGE');
    const { roomId, direction = sdk.EventTimeline.BACKWARDS, size = MAX_MESSAGES_SHOW, makeRequest = true } = payload;
    // const room = this.matrixClient.getRoom(roomId);
    const timelineWindow = this.timelineWindowMap.get(roomId);
    // console.log(timelineWindow);
    try {
      if (!timelineWindow.canPaginate(direction)) {
        // return new AgentMessage(true, false, { roomId, from: 'moreTimeline' });
      }
      await timelineWindow.paginate(direction, size, makeRequest);
      const mxEvents = timelineWindow.getEvents();
      // console.log(mxEvents);
    } catch (error) {
      // re-create timelineWindow for this room
      // debugger;

      // await this._initTimelineWindow(room);
    }
    // const updateRoom = this.getRoomInfo(roomId);
    // if (updateRoom) {
    //   try {
    //     updateRoom.lastMessage = this.getLastMessage(room, updateRoom.isDirect);
    //     this.updateRoom(updateRoom, 'timeline');
    //   } catch (e) {
    //     // console.log(e);
    //   }
    // }
    // return new AgentMessage(true, true, { roomId, from: 'moreTimeline' });
  }
}
