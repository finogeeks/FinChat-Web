const env = process.env.NODE_ENV;
const IAM_INFO_KEY = 'Model:iam-info';
const CLIENT_ID = 'finchat-desktop';
const REALMS = 'master';
const IAM_URL = 'https://iam3.finogeeks.club:7777';
const BASE_URL = env === 'development' ? 'https://finchat-dev.finogeeks.club' : 'https://api.finogeeks.club';
// const BASE_URL = 'https://api.finogeeks.club';
// const BASE_URL = 'https://finchat-dev.finogeeks.club';
// const BASE_URL = 'http://fino.qhee.com.cn';
const WEB_NAME = 'FinChat';
const RoomType = {
    channel: 'CHANNEL',
    dispatch: 'DISPATCH',
    advisor: 'ADVISOR',
    smartBot: 'SMART_BOT',
    normalBot: 'NORMAL_BOT',
}
const MSG_TYPE_ALERT = {
    text: 'm.text',
    image: 'm.image',
    video: 'm.video',
    audio: 'm.audio',
    location: 'm.location',
    file: 'm.file',
    alert: 'm.alert',
    url: 'm.url',
}
const MSG_TYPE = {
    text: 'm.text',
    image: 'm.image',
    video: 'm.video',
    audio: 'm.audio',
    location: 'm.location',
    file: 'm.file',
    alert: 'm.alert',
    url: 'm.url',
}

export {
    IAM_INFO_KEY,
    CLIENT_ID,
    REALMS,
    IAM_URL,
    BASE_URL,
    WEB_NAME,
    RoomType,
    MSG_TYPE_ALERT,
    MSG_TYPE,
}