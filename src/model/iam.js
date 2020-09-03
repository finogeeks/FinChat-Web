import axios from 'axios';
import qs from 'qs';
import { IAM_INFO_KEY, CLIENT_ID, REALMS, IAM_URL, BASE_URL } from '@/commonVariable';
import {startJwtRefresh,stopJwtRefresh} from '@/jwtRefresh';

// iam info 处理模块

axios.interceptors.response.use(response =>
  response
  , error => Promise.reject({
  msg: error,
  data: error.response.data,
}));

const instance = axios.create({ 
  baseURL: '',
  headers: {
    // 'content-type': 'application/x-www-form-urlencoded',
  },
});

export function getInfo() {
  const iamInfo = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY));
  const userId = iamInfo ? iamInfo.user_id : null;
  const lastLoginUserId = window.localStorage.getItem('lastLoginUserId');
  // if (lastLoginUserId && userId && lastLoginUserId === userId) {
  //   return iamInfo;
  // }
  // return null;
  return iamInfo;
}

export function setInfo(info) {
  // console.log('set info', info);
  window.localStorage.setItem(IAM_INFO_KEY, JSON.stringify(info));
}

export function removeInfo() {
  // console.log('removeInfo');
  window.localStorage.removeItem(IAM_INFO_KEY);
}

export async function getVerifyCode(phone) {
  let response;
  await instance.request({
    method: 'GET',
    url: `/api/v1/finchat/contact/manager/register/phone/${phone}`,
  }).then(res => {
    response = res;
  }).catch(err => {
    response = err.response;
  })
  return response;
}

export async function verifyVerifyCode(phone, verifyCode, type) {
  let response;
  await instance.request({
    method: 'POST',
    url: `/api/v1/finchat/contact/manager/register/verify`,
    data: {
      phone, verifyCode, type
    }
  }).then(res => {
    response = res;
  }).catch(err => {
    response = err.response;
  })
  return response;
}

export async function changeBySms({phone, verifyCode, password}) {
  let response;
  await instance.request({
    method: 'PUT',
    url: `/api/v1/finchat/contact/manager/register/changeBySms`,
    data: {
      phone, verifyCode, password
    }
  }).then(res => {
    response = res;
  }).catch(err => {
    response = err.response;
  })
  return response;
}

export async function userRegist({phone, verifyCode, account, password}) {
  let response;
  await instance.request({
    method: 'POST',
    url: `/api/v1/finchat/contact/manager/register`,
    data: {
      phone, verifyCode, account, password
    }
  }).then(res => {
    response = res;
  }).catch(err => {
    response = err.response;
  })
  return response;
}

export async function login(userName, userPassWord) {
  let response = null;
  let browser = '';
  let userAgent = navigator.userAgent;
  const Agents = [ "Windows", "Mac", "Intel", "linux", "Freebsd", "Android", "iPhone", "symbianos", "ipad", "ipod", "CPU"];
  let system = '';
  let reg;
  for (var v = 0; v < Agents.length; v++) {
      if (userAgent.indexOf(Agents[v]) > 0) {
          reg = new RegExp(`${Agents[v]} .*?\\)`)
          reg = reg.exec(userAgent)[0];
          system = reg.substr(0, reg.length -1)
          break;
      }
  }
  userAgent = navigator.userAgent.toLowerCase();
  let s;
  (s = userAgent.match(/msie ([\d.]+)/)) ? browser = `ie: ${s[1]}` : (s = userAgent.match(/firefox\/([\d.]+)/)) ? browser = `firefox: ${s[1]}` : (s = userAgent.match(/chrome\/([\d.]+)/)) ? browser = `chrome: ${s[1]}` : (s = userAgent.match(/opera.([\d.]+)/)) ? browser = `opera: ${s[1]}` : (s = userAgent.match(/version\/([\d.]+).*safari/)) ? browser = `safari: ${s[1]}` : 0;
  // const displayName = {
  //   loginTime: new Date().getTime(),
  //   system: browser.replace(/:/g,'').replace(/ /g,''),
  //   clientType: '',
  //   deviceName: 'web',
  // }
  await instance.request({
    method: 'POST',
    url: `/api/v1/registry/login`,
    data: {
      "userId": userName,
      "password": userPassWord,
      "login_type": "pwd",
      "device_id": `web-${new Date().getTime()}`,
      "app_type": "STAFF",
      "display_name": `{\"loginTime\":${new Date().getTime()},\"system\":\"${system} - Web\",\"clientType\":\"\",\"deviceName\":\"${browser.replace(/:/g,'').replace(/ /g,'')}\"}`,
      "device_type": "web"
    },
  }).then(res => {
    response = res;
  }).catch(err => {
    response = err.response;
  });
  return response;
}

export async function logout() {
  const basic = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY))
  let response = null;
  await instance.request({
    method: 'POST',
    url: '/api/v1/registry/homeserver/logout',
    data: {
      access_token: basic.access_token,
    }
  }).then(res => {
    stopJwtRefresh();
    response = res;
  }).catch(err => {
    response = err.response;
  });
}

export function refreshTokenRequest(refreshToken) {
  return instance.request({
    method: 'POST',
    url: `${IAM_URL}/auth/realms/${REALMS}/protocol/openid-connect/token`,
    data: qs.stringify({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }),
  });
}

export function getUserInfo(accessToken) {
  return instance.request({
    method: 'GET',
    url: `${IAM_URL}/auth/realms/${REALMS}/protocol/openid-connect/userinfo`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getIAMUserInfo() {
  const iamInfo = getInfo();
  if (iamInfo) {
    const { token, refreshToken } = iamInfo;
    let userRes = await getUserInfo(token).catch(() => null);
    if (userRes && userRes.data) {
      iamInfo.userInfo = userRes.data;

      setInfo(iamInfo);
      return iamInfo;
    }
    const tokenRes = await refreshTokenRequest(refreshToken).catch(() => null);
    if (!tokenRes) return null;

    const { access_token: newToken, refresh_token: newRefreshToken } = tokenRes.data;
    userRes = await getUserInfo(tokenRes.data.access_token).catch(() => null);

    const res = {
      id: iamInfo.id,
      token: newToken,
      refreshToken: newRefreshToken,
      userInfo: userRes.data,
    };
    setInfo(res);

    return res;
  }
  return null;
}

export function bindAccount({ url, jwt, token, type = 'bind' }) {
  return axios({
    url: `${url}/api/v1/finchat/contact/manager/staff/keycloak`,
    method: 'POST',
    data: ({
      token,
      type,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
  }).catch((err) => {
    // console.log(err);
    return err;
  });
}

export const getAccountData = async () => {
  return (await window.mxClient.getAccountData({ type: 'm.modular.swan.dispatch' })) || {}
}

export const joinRoom = async (roomId) => {
  const basic = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY))
  return instance.request({
    url: `/api/v1/channel/rooms/${roomId}/privateJoin?access_token=${basic.access_token}&jwt=${basic.jwt}`,
    method: 'POST',
    data: ({
      user_id: basic.user_id,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${basic.jwt}`,
    },
  });
};

export const inviteAndJoin = async (roomId, userid) => {
  const basic = JSON.parse(window.localStorage.getItem(IAM_INFO_KEY))
  return instance.request({
    url: `/api/v1/channel/rooms/${roomId}/inviteAndJoin?access_token=${basic.access_token}&jwt=${basic.jwt}`,
    method: 'POST',
    data: ({
      user_id: userid,
      qrcode: true,
    }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${basic.jwt}`,
    },
  });
};

export const getChannelDetail = (roomId) => {
  return instance.request({
    method: 'GET',
    url: `/api/v1/channel/channels/${roomId}`,
  });
}

export default {
  getInfo,
  setInfo,
  removeInfo,
  login,
  getUserInfo,
  refreshTokenRequest,
  getIAMUserInfo,
  bindAccount,
  joinRoom,
  getChannelDetail,
  inviteAndJoin,
  logout,
  getVerifyCode,
  verifyVerifyCode,
  userRegist,
  changeBySms,
};
