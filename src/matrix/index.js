import sdk from '@finogeeks/matrix-js-sdk';
import RoomModule from './modules/room';
import ViewingRoomModule from './modules/viewing-room';
import UserModule from './modules/user';
import emitter from '@/utils/event-emitter';

import {
  DB_NAME,
  FILTER_DEFINITION,
} from './config';

class Matrix {
  constructor() {
    this.baseUrl = null;
    this.deviceId = null;
    this.accessToken = null;
    this.jwtToken = null;
    this.userId = null;
    this.mxClient = null;
    this.room = null;
    this.viewingRoom = null;
    this.user = null;
    this.ipcBridge = null;
    this.isReady = false;
  }

  async start(opts) {
    this.baseUrl = opts.baseUrl;
    this.deviceId = opts.deviceId;
    this.accessToken = opts.accessToken;
    this.jwtToken = opts.apiToken;
    this.appType = opts.appType;
    this.permission = opts.permission;
    this.userId = opts.userId;
    if (this.mxClient) {
      await this.mxClient.stopClient();
      this.mxClient = null;
    }
    const mxOpts = {
      baseUrl: this.baseUrl,
      idBaseUrl: 'https://vector.im',
      accessToken: this.accessToken,
      userId: this.userId,
      deviceId: this.deviceId,
      timelineSupport: true,
      sessionStore: new sdk.WebStorageSessionStore(window.localStorage),
      store: new sdk.IndexedDBStore({
        indexedDB: window.indexedDB,
        dbName: DB_NAME,
        localStorage: window.localStorage,
        workerScript: window.vector_indexeddb_worker_script || null,
      }),
    };
    const moduleOpts = {
      baseUrl: this.baseUrl,
      accessToken: this.accessToken,
      userId: this.userId,
      deviceId: this.deviceId,
      jwt: this.jwtToken,
      store: this.store,
    };
    this.mxClient = sdk.createClient(mxOpts);
    await this.startUpMatrixStore();
    this.mxClient.on('sync', async (state, prevState, data) => {
      // console.log('this.mxClient.on sync', state, data);
      switch (state) {
        case 'ERROR':
          // update UI to say "Connection Lost"
          // console.log('SYNC ERROR');
          // console.log(data);
          if (data.error.httpStatus === 401) {
            emitter.emit('TOKEN_INVALID');
          }
          break;
        case 'SYNCING':
          // update UI to remove any "Connection Lost" message
          break;
        case 'PREPARED':
          if (this.isReady) return;
          await this.init(moduleOpts);
          // setTimeout(() => {
            emitter.emit('MATRIX_PREPARED', this);
          // }, 3000);
          break;
        default: break;
      }
    });
    // this.mxClient.on('event', (event) => {
    //   console.log('this.mxClient.on(event)', event);
    // });
    const filter = new sdk.Filter(this.userId);
    filter.setDefinition(FILTER_DEFINITION);
    this.mxClient.startClient({
      debug: false,
      pollTimeout: 30000,
      filter,
    });
    window.mxClient = this.mxClient;
  }

  async startUpMatrixStore() {
    let needClear = false;
    const store = this.mxClient.store;
    const lastLoginUserId = window.localStorage.getItem('lastLoginUserId');
    if (!lastLoginUserId || lastLoginUserId !== this.userId) {
      needClear = true;
    }
    const isStoreNewlyCreated = await store.isNewlyCreated();
    await this.mxClient.store.startup(needClear && !isStoreNewlyCreated);
    window.localStorage.setItem('lastLoginUserId', this.userId);
    window.localStorage.setItem('lastUsedHomeServer', this.homeServerUrl);
  }

  stop() {
    this.mxClient.stopClient();
    this.mxClient = null;
    this.room = null;
    this.user = null;
    this.viewingRoom = null;
    this.isReady = false;
  }

  async init(moduleOpts) {
    // console.log('Matrix init');
    return new Promise (async (resolve, reject) => {
      this.room = await new RoomModule(this.mxClient, moduleOpts);
      this.viewingRoom = await new ViewingRoomModule(this.mxClient, moduleOpts);
      this.user = await new UserModule(this.mxClient, moduleOpts);
      this.isReady = true;
      // console.log('Matrix init end');
      resolve(true);
      // setTimeout(() => {
      //   console.log('Matrix init end');
      //   resolve(true);
      // }, 5000);
    })
  }
}

export default Matrix;
