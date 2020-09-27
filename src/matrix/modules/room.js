import emitter from '@//utils/event-emitter';
import BaseModule from './base';

export default class RoomModule extends BaseModule {
  constructor(mxClient, opts) {
    super(mxClient, opts);
    this.roomMap = new Map();
    this.joinRoomMap = new Map();
    this.inviteRoomMap = new Map();
    this.deleteRoomMap = new Map();

    // directRoomMap 的key是 userID ！
    this.directRoomMap = new Map();
    this.init();
  }

  async init() {
    // console.log('RoomModule init');
    await this.syncRooms();
    this.mxClient.on('Room.timeline', this.updateLastMsg.bind(this));
    this.mxClient.on('Room.receipt', this.updateUnread.bind(this));
    this.mxClient.on('RoomMember.membership', (event, member, oldmembership) => {

    });
    this.mxClient.on('accountData', (mxEvent) => {
      // console.log('accountData');
      if (mxEvent.getType() === 'm.push_rules') {
        this.syncRooms();
      }
    });
    this.mxClient.on('Room.tags', async (mxEvent, mxRoom) => {
      // console.log('Room.tags');
      const newRoom = await this.buildRoom(mxRoom);
      if (!newRoom) return;
      this.setRoom(newRoom);
      emitter.emit('ROOM_UPDATE', newRoom, mxEvent, mxRoom);
    });
    // console.log('ROOM MODULE INIT END');
  }

  async syncRooms() {
    const mxRooms = this.mxClient.getRooms();
    // console.log(mxRooms);
    console.time();
    const setrooms = mxRooms.map(async mxRoom => this.setRoom(await this.buildRoom(mxRoom)));
    await Promise.all(setrooms);
    // console.log('room init time');
    console.timeEnd();
    emitter.emit('ROOMS_INIT', this.sortRoomByLastUpdateTime([...this.joinRoomMap.values()]));
  }

  // initTimeLine(mxRooms) {
  //   const roomTimeLine = {};
  //   mxRooms.forEach(room => {
  //     roomTimeLine[room.roomId] = [];
  //     room.timeline.forEach(e => {
  //       roomTimeLine[room.roomId].push(this.buildTimelineMessage(e,room));
  //     });
  //   });
  //   emitter.emit('INIT_TIMELINE', roomTimeLine);
  // }

  registerEventBridge() {
    // eventBridge.addEventListener('GET_ROOM', this.handleGetRoom.bind(this));
  }

  handleGetRoom(roomId) {
    // this.
  }

  updateRoom(mxRoom) {
    // console.log('Matrix.room on: Room', mxRoom);
    const newRoom = this.buildRoom(mxRoom);
    // console.log(newRoom);
    if (!newRoom) return;
    this.setRoom(newRoom);
    // eventBridge.emit('UPDATE_ROOM_LIST');
  }

  async updateLastMsg(mxEvent, mxRoom, toStartOfTimeline, removed, data) { // eslint-disable-line
    // TODO 只跟新消息 并且 列表更新变动这一个房间的而不是全刷
    // console.log('Matrix.room on: Room.timeline', mxEvent, mxRoom, toStartOfTimeline, removed, data);
    // console.log('toStartOfTimeline', toStartOfTimeline);
    // console.log('removed', removed);
    // console.log('data', data);
    if (!toStartOfTimeline && mxEvent.event.type !== 'm.room.create') {
      // console.log('Matrix.room on: Room.timeline', mxEvent, mxRoom, mxEvent.event.content.body, data);
      const newRoom = await this.buildRoom(mxRoom);
      if (!newRoom) return;
      this.setRoom(newRoom);
      emitter.emit('ROOM_UPDATE', newRoom, mxEvent, mxRoom);
      emitter.emit('NEW_MSG_ALERT', mxEvent, newRoom);
      // eventBridge.emit('UPDATE_ROOM_LIST');
    }
  }

  async updateUnread(mxEvent, mxRoom) {
    // TODO 只跟新消息 并且 列表更新变动这一个房间的而不是全刷
    // // console.log('Matrix.room on: Room.receipt', mxEvent, mxRoom.roomId);
    // console.log('Matrix.room on: Room.receipt', mxEvent, mxRoom);
    const newRoom = await this.buildRoom(mxRoom);
    if (!newRoom) return;
    this.setRoom(newRoom);
    emitter.emit('ROOM_UPDATE', newRoom);
    // eventBridge.emit('UPDATE_ROOM_LIST');
    // eventBridge.emit(`${mxRoom.roomId}.UPDATE_ROOM`, newRoom);
  }

  setRoom(room) {
    // console.log('~~~~~~ setRoom ~~~~~');
    if (!room.roomId) return;
    this.roomMap.set(room.roomId, room);
    if (room.membership === 'join') {
      this.joinRoomMap.set(room.roomId, room);
    }
    if (room.membership === 'invite' && !room.isDirect) {
      this.joinRoomMap.set(room.roomId, room);
    }
    if (room.isDelete) {
      this.deleteRoomMap.set(room.roomId, room);
    }
    // directRoomMap 的key是 userID ！
    if (room.isDirect) {
      const peerMember = room.members.find(member => member && member.userId !== this.userId);
      if (!peerMember) return;
      this.directRoomMap.set(peerMember && peerMember.userId, room);
    }
  }

  handleRoomUpdate = (roomId) => {
    const mxRoom = this.mxClient.getRoom(roomId);
    if (!mxRoom) return;
    const newRoom = this.buildRoom(mxRoom);
    if (!newRoom) return;
    this.setRoom(newRoom);
    this.emitRoomEvent(); // TODO 更新store 、或者通过ipc-bridge回传给其他进程
  }

  emitRoomEvent(roomEvent) {
    if (!roomEvent) return null;
  }

  getRoom(roomId) {
    if (!roomId) return null;
    return this.roomMap.get(roomId);
  }

  getAllRooms() {
    return [...this.roomMap.values()];
  }

  getAllSortedRooms() {
    return this.sortRoomByLastUpdateTime([...this.roomMap.values()]);
  }

  addRoom(roomId) {
    if (!roomId) return null;
  }

  sortRoomByLastUpdateTime(rooms) {
    return rooms.sort((a, b) => {
      if (!a.lastUpdateTime) {
        return 1;
      }
      if (!b.lastUpdateTime) {
        return -1;
      }
      return a.lastUpdateTime - b.lastUpdateTime >= 0 ? -1 : 1;
    });
  }

  // 置顶房间
  stickRoom(roomId) {

  }

  unstickRoom(roomId) {

  }

  isRoomReady(room) {
    return !!room && room.membership === 'join';
  }
}
