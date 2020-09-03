import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import '@/assets/common.scss'
import iView from 'iview';
import './my-theme/index.less';
import moment from 'moment';
import { IAM_INFO_KEY } from '@/commonVariable';
import emitter from '@/utils/event-emitter';
const { FinChatNormal, FinChatNetDisk } = require('@finogeeks/matrix-js-sdk');
const { login, startMatrix, addPreparedEmitter } = require('./utils.js');
import {startJwtRefresh,stopJwtRefresh} from './jwtRefresh';

Vue.prototype.$moment = moment;
// console.log('====FinChatNetDisk===');
// console.log(FinChatNetDisk);
Vue.prototype.$fcNetdisk = new FinChatNetDisk();

Vue.use(iView);

router.beforeEach(async (to, from, next) => {
  const topath = to.path;
  const {afterlog} = store.state;
  const iamInfo = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY));
  const hadLogged = iamInfo && iamInfo.access_token;
  // console.log(to,from);
  // console.log('afterlog', afterlog);
  if (to.query.chatroom) {
    store.commit('setChatRoom', to.query.chatroom);
  }
  if (to.query.type === 'CONSULT') {
    addPreparedEmitter();
    await startMatrix();
    next('/consult');
  }
  if (topath === '/consult') {
    addPreparedEmitter();
    await startMatrix();
    next();
  }
  if (hadLogged) {
    startJwtRefresh();
    switch (topath) {
      case '/':
        next('/chat');
        break;
      case '/login':
        next('/chat');
        break;
      case '/chat':
        if (afterlog) {
          next();
          // store.commit('setShowLoadingMask', false);
        } else{
          addPreparedEmitter();
          await startMatrix();
          emitter.addListener('MATRIX_PREPARED', () => {
            next();
            // store.commit('setShowLoadingMask', false);
          })
        }
        break;
      default:
        next();
        break;
    }
  } else {
    switch (topath) {
      case '/':
        next();
        break;
      case '/login':
        next();
        break;
      case '/chat':
        console.log('case chat');
        next('/login');
        break;
      default:
        next();
        break;
    }
  }
});

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
