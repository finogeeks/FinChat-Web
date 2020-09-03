
import emitter from '@/utils/event-emitter';
import IAM from '@/model/iam';
import axios from 'axios';
import Vue from 'vue'
import store from './store'
const testHostnameList = ['localhost','finchat-dev.finogeeks.club'];
const showSingUpHostname = ['localhost','finchat-dev.finogeeks.club', 'chat.finogeeks.com'];
const hostname = window.location.hostname;
const isDev = testHostnameList.indexOf(hostname) > -1;
const overDueTime = (IAM.getInfo() && IAM.getInfo().expires_in) || (testHostnameList.indexOf(hostname) > -1 ? 120 : 7200);
const body = document.querySelector('html');
// console.log('jwtRefresh ~~~ ', overDueTime);
let userMonitor;
let jwtRefresher;
function monitorUserOperate() {
    clearTimeout(userMonitor)
    userMonitor = setTimeout(() => {
        emitter.emit('TOKEN_INVALID');
    }, overDueTime*1000);
}
function refreshjwt() {
    const jwtinfo = IAM.getInfo();
    axios.post('/api/v1/registry/token', {
        user_id: jwtinfo.user_id,
        refresh_token: jwtinfo.refresh_token,
        grant_type: 'refresh_token'
    })
    .then(res => {
        console.log('refresh_token', res);
        const newjwtinfo = Object.assign(jwtinfo, res.data, {jwt: res.headers.authorization});
        IAM.setInfo(newjwtinfo);
        Vue.prototype.$fcNetdisk.init(
            '', 
            newjwtinfo.userId,
            newjwtinfo.jwt,
            newjwtinfo.access_token,
        );
    })
    .catch(err => {
        console.log('refresh_token', err);
        emitter.emit('TOKEN_INVALID');
    })
}
async function startJwtRefresh() {
    await refreshjwt();
    console.log('startJwtRefresh');
    body.addEventListener("click",monitorUserOperate);
    body.addEventListener("keydown",monitorUserOperate);
    body.addEventListener("mousemove",monitorUserOperate);
    body.addEventListener("mousewheel",monitorUserOperate);
    userMonitor = setTimeout(() => {
        console.log('长时间未操作');
        emitter.emit('TOKEN_INVALID');
    }, overDueTime*1000);
    jwtRefresher = setInterval(refreshjwt, overDueTime*0.8*1000)
}
function stopJwtRefresh() {
    console.log('stopJwtRefresh');
    store.commit('setShowLoadingMask', false);
    body.removeEventListener("click",monitorUserOperate);
    body.removeEventListener("keydown",monitorUserOperate);
    body.removeEventListener("mousemove",monitorUserOperate);
    body.removeEventListener("mousewheel",monitorUserOperate);
    clearTimeout(userMonitor)
    clearInterval(jwtRefresher);
}
export {
    startJwtRefresh,
    stopJwtRefresh,
    testHostnameList,
    showSingUpHostname,
    isDev
}