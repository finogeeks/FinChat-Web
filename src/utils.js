import IAM from '@/model/iam';
import Matrix from '@/matrix';
import emitter from '@/utils/event-emitter';
import router from './router';
import store from './store';

const addPreparedEmitter = () => {
  // console.log('addPreparedEmitter');
  store.commit('setShowLoadingMask', true);
  emitter.addListener('MATRIX_PREPARED', (matrix) => {
    // store.commit('setShowLoadingMask', false);
    // console.log('EMIT MATRIX_PREPARED');
    // console.log(matrix);
    window.matrix = matrix;
    const userInfo = IAM.getInfo();
    const { user_id: userId } = userInfo;
    const myinfo = window.mxClient.getUser(userId);
    store.commit('setMyInfo', myinfo);
  });
};

const login = async (username, password) => {
  store.commit('setShowLoadingMask', true);
  addPreparedEmitter();
  emitter.addListener('MATRIX_PREPARED', (matrix) => {
    // console.log('MATRIX_PREPARED');
    store.commit('setAfterlog', true);
    router.push({
      path: '/chat',
    });
  });
  // console.log('LOGIN');
  const loginRes = await IAM.login(username, password);
  // console.log(loginRes);
  if (loginRes.status === 200) {
    const { device_id: deviceId, access_token: accessToken, user_id: userId } = loginRes.data;
    IAM.setInfo({ ...loginRes.data, jwt: loginRes.headers.authorization });
    await startMatrix();
  } else {
    return loginRes;
  }
};

const startMatrix = async () => {
  store.commit('setShowLoadingMask', true);
  if (window.matrix) return;
  const userInfo = IAM.getInfo();
  // // console.log(window.localStorage.getItem('Model:iam-info'));
  // // console.log(userInfo);
  const { device_id: deviceId, access_token: accessToken, user_id: userId } = userInfo;
  const matrix = new Matrix();
  await matrix.start({
    appType: 'STAFF',
    deviceId,
    accessToken,
    userId,
    baseUrl: window.location.origin,
  });
};

const agentJudge = (() => {
  const userAgent = navigator.userAgent; // 取得浏览器的userAgent字符串
  const isOpera = userAgent.indexOf('Opera') > -1; // 判断是否Opera浏览器
  const isIE = userAgent.indexOf('compatible') > -1
            && userAgent.indexOf('MSIE') > -1 && !isOpera; // 判断是否IE浏览器
  const isEdge = userAgent.indexOf('Edge') > -1; // 判断是否IE的Edge浏览器
  const isFF = userAgent.indexOf('Firefox') > -1; // 判断是否Firefox浏览器
  const isSafari = userAgent.indexOf('Safari') > -1
            && userAgent.indexOf('Chrome') == -1; // 判断是否Safari浏览器
  const isChrome = userAgent.indexOf('Chrome') > -1
            && userAgent.indexOf('Safari') > -1; // 判断Chrome浏览器

  if (isIE) {
    const reIE = new RegExp('MSIE (\\d+\\.\\d+);');
    reIE.test(userAgent);
    const fIEVersion = parseFloat(RegExp.$1);
    if (fIEVersion == 7) {
      return 'IE7';
    } else if (fIEVersion == 8) {
      return 'IE8';
    } else if (fIEVersion == 9) {
      return 'IE9';
    } else if (fIEVersion == 10) {
      return 'IE10';
    } else if (fIEVersion == 11) {
      return 'IE11';
    }
    return '0';
    // IE版本过低
    return 'IE';
  }
  if (isOpera) {
    return 'Opera';
  }
  if (isEdge) {
    return 'Edge';
  }
  if (isFF) {
    return 'FF';
  }
  if (isChrome) {
    return 'Chrome';
  }
  if (isSafari) {
    return 'Safari';
  }
})();

export {
  login,
  startMatrix,
  agentJudge,
  addPreparedEmitter,
};
