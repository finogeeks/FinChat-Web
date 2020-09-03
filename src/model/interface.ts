

export interface RoomMember {
  // indexdb Id
  id?: number;
  membership: string; // 当前的房间id
  avatar: string;
  powerLevel: number; // 当前用户等级
  name: string;
  rawDisplayName: string;
  roomId: string;
  userId: string;
}

export type BooleanInt = 0 | 1;

export interface Room {
  // id
  roomId?: string;
  // 名称
  name?: string;
  // 是否为直聊房间
  isDirect?: BooleanInt;
  // 是否开启免打扰
  isMute?: BooleanInt;
  // 是否被当前用户删除
  isDelete?: BooleanInt;
  // 是否为保密房间
  isSecret?: BooleanInt;
  // 是否加密房间
  isEncryped?: BooleanInt;
  // 是否开启转发
  enableForward?: BooleanInt;
  // 是否开启收藏
  enableFavorite?: BooleanInt;
  // 是否开启截屏
  enableSnapshot?: BooleanInt;
  // 是否开始水印
  enableWatermark?: BooleanInt;
  // 房间成员
  members?: RoomMember[];
  // 房间话题
  roomTopic?: string | number;
  // 当前用户未读
  unread?: number;
  // 当前用户被alert的个数
  highlight?: number;
  // 当前用户状态
  membership?: string;
  // 当前用户权限
  powerLevel?: number;
  // 房间头像
  avatar?: string;
  // 历史记录是否可见
  historyVisibility?: HistoryVisibility;
  // 是否置顶
  isTop?: BooleanInt;
  // 置顶时间
  topSysTime?: number;
  // 最后更新时间
  lastUpdateTime?: number;
  // 房间时间
  createTime?: number;
  // 房间创建者 userId
  createrId?: string;
  // 当前房间共有多少人在打字
  typingCount?: number;
  // 房间权限
  power?: RoomPower;
  // 最后一条消息
  lastMessage?: LastMessage;
}

export interface RoomPower {
  inviteUser: number;
  kickUser: number;
  redactUser: number;
  banUser: number;
  setAvatar: number;
  setHistoryVisibility: number;
  setName: number;
  setPowerLevel: number;
  sendMessage: number;
}

export interface LastMessage {
  eventId: string;
  msgType: string;
  msgBody: string;
  msgTypeInfo: string;
  status: string;
  eventTime: string;
}

export interface RoomBasic {
  roomId: string;
  lastUpdateTime: number;
  createTime: number;
  isTop: BooleanInt;
  name: string;
  isMute: BooleanInt;
  unread: number;
  highlight: number;
  roomTopic: string | number;
  isSecret: BooleanInt;
  isDelete: BooleanInt;
  avatar: string;
  membership: string;
  lastMessage?: LastMessage;
  draftMessage?: LastMessage;
  members: RoomMember[];
  isDirect: BooleanInt;
}

export interface RoomPosition {
  isTop: BooleanInt;
  roomIndex: number;
}

export enum MessageStatus {
  fail = 'fail',
  success = 'success',
  sending = 'sending',
  encrypt = 'encrypt',
}

export enum RoomMembership {
  // forget = 'forget',
  join = 'join',
  invite = 'invite',
  leave = 'leave',
  ban = 'ban',
}

export enum HistoryVisibility {
  invited = 'invited',
  joined = 'joined',
  shared = 'shared',
  worldReadable = 'world_readable',
}

export enum RoomBasicOpType {
  addRoom,
  deleteRoom,
  updateRoom,
}

export interface RoomTopic {
  topic: string;

}


export enum RoomJoinRules {
  PUBLIC = 'public',
  INVITE = 'invite',
}

export enum RoomGuestAccess {
  CAN_JOIN = 'can_join',
  FORBIDDEN = 'forbidden',
}
