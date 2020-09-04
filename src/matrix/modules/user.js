import eventBridge from '@/utils/event-bridge';
import BaseModule from './base';
import emitter from '@/utils/event-emitter';

import {
  DEFAULT_ENCRYPTION_ALGORITHM,
  DB_NAME,
  AVATAR_SIZE,
  MAX_MESSAGES_SHOW,
  FILTER_DEFINITION,
} from '../config';
export default class UserModule extends BaseModule {
  constructor(mxClient, opts) {
    super(mxClient, opts);
    this.userMap = new Map();
    this.init();
  }

  // TODO update room 的时候需要对成员们进行build
  // usermap的更新时机有问题，每次取的时候先从map拿，拿不到的话要从mxClient重新拿并buildUser并setUser

  init() {
    const mxUsers = this.mxClient.getUsers();
    mxUsers.forEach(mxUser => this.setUser(this.buildUser(mxUser)));
    emitter.emit('USERS_INIT', this.userMap);
    // eventBridge.registerProxy('getMyUserEntity', this.getMyUserEntity.bind(this));
    this.mxClient.on('User.avatarUrl', this.handleUserUpdate.bind(this));
    this.mxClient.on('User.currentlyActive', this.handleUserUpdate.bind(this));
    this.mxClient.on('User.displayName', this.handleUserUpdate.bind(this));
    this.mxClient.on('User.lastPresenceTs', this.handleUserUpdate.bind(this));
    this.mxClient.on('User.presence', this.handleUserUpdate.bind(this));
    // console.log('USER MODULE INIT END');
  }

  setUser(userObj) {
    if (!userObj || !userObj.userId) return;
    this.userMap.set(userObj.userId, userObj);
  }

  handleUserUpdate(mxEvent, mxUser) {
    // console.log('UserModule.handleUserUpdate', mxEvent, mxUser);
    // console.log('UserModule.handleUserUpdate', mxUser.userId);
    this.setUser(this.buildUser(mxUser));
  }

  getMyUserEntity() {
    const mxUser = this.mxClient.getUser(this.userId);
    return this.buildUser(mxUser);
  }
}
