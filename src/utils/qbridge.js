import clientBus from '@finogeeks/qbridge';
import eventBridge from '@/utils/event-bridge';
import iconv from 'iconv-lite';
import axios from 'axios';

/**
 * 一个集成进finchat的的本地模块，负责与桌面端与外挂的交互
 * 主要功能包括：
 * - 唤起外挂
 * - 维护外挂与QQ的连接状态
 * - 监听外挂sync到的QQ消息，调用QClient发送给homeserver
 * - 转发FC发出的QQ消息到外挂
 * - TODO QQ链接事件（与外挂丢失链接期间会丢失消息，房间状态提醒用）
 * @class QBridge
 */
class QBridge {
  constructor() {
    this.fqid = null;
    this.qqAccessToken = null;
  }
  async init(mxOpts) {
    const instance = axios.create({
      baseURL: mxOpts.baseUrl,
      params: {
        jwt: mxOpts.apiToken,
        access_token: mxOpts.accessToken,
      },
    });

    let qbridgeAddress = window.localStorage.getItem('qbridgeAddress');
    if (!qbridgeAddress) {
      window.localStorage.setItem('qbridgeAddress', 'ws://localhost:3333');
      qbridgeAddress = 'ws://localhost:3333';
    }
    instance.defaults.headers.common['X-Consumer-Custom-ID'] = mxOpts.userId;
    instance.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
    this.$http = instance;
    const topicList = ['QQHook.QQMessage'];
    const opts = {
      topicList,
      socketURL: qbridgeAddress,
    };
    clientBus.open(opts.socketURL, opts.topicList).then((json) => {
      // console.log(`open ${opts.socketURL}`, json);
    }).catch((err) => {
      // console.log(err);
    });
    clientBus.setPublish((data) => {
      this.handleQmsg(data);
    });
    this.registerEventBridge();
  }

  registerEventBridge() {
    eventBridge.on('QBRIDGE.SEND_TO_QQ', this.makeQQsendMsg.bind(this));
    eventBridge.registerProxy('getBindState', this.getBindState.bind(this));
  }

  async getBindStateFromFcid(fcid) {
    try {
      const response = await this.$http({
        method: 'GET',
        url: `/api/v1/qbridge/bind/fcid/${fcid}`,
      });
      this.fqid = (response.data.states && response.data.states[0] && response.data.states[0].bfcid) || null;
      this.qqAccessToken = (response.data.states && response.data.states[0] && response.data.states[0].token) || null;
      window.localStorage.setItem('fqid', this.fqid);
      window.localStorage.setItem('qqAccessToken', this.qqAccessToken);
      return (response.data.states && response.data.states[0]) || {};
    } catch (error) {
      return false;
    }
  }

  async getBindState(qq) {
    try {
      const response = await this.$http({
        method: 'GET',
        url: `/api/v1/qbridge/bind/state?qq=${qq}`,
      });
      return response;
    } catch (error) {
      return false;
    }
  }

  async getBindStates(qqList) {
    try {
      const response = await this.$http({
        method: 'POST',
        url: '/api/v1/qbridge/bind/state',
        data: JSON.stringify({ qqs: qqList }),
      });
      return response;
    } catch (error) {
      return false;
    }
  }

  async bindQQ(qqid, fcid) {
    try {
      const response = await this.$http({
        method: 'POST',
        url: '/api/v1/qbridge/bind',
        data: JSON.stringify({ qq: qqid.toString(), fcid }),
      });
      if (response.data.bfcid) {
        window.localStorage.setItem('fqid', response.data.bfcid);
        this.fqid = response.data.bfcid;
      }
      if (response.data.access_token) {
        window.localStorage.setItem('qqAccessToken', response.data.access_token);
        this.qqAccessToken = response.data.access_token;
      }
      // return true;
      return {
        fqid: this.fqid,
        qqAccessToken: this.qqAccessToken,
      };
    } catch (error) {
      return false;
    }
  }

  async unBindQQ(fcid, qq) {
    try {
      const response = await this.$http({
        method: 'POST',
        url: '/api/v1/qbridge/unbind',
        data: JSON.stringify({ qq, fcid }),
      });
      window.localStorage.setItem('fqid', '');
      this.fqid = '';
      window.localStorage.setItem('qqAccessToken', '');
      this.qqAccessToken = '';
      return response;
    } catch (error) {
      return false;
    }
  }

  /**
   * 使用超级克隆账号接口往homeser装发QQ消息
   * TODO 扩充消息类型
   *
   * @param {object} payload
   * @param {String} payload.sender 发送者QQ号
   * @param {String} payload.receiver 接受者QQ号
   * @param {object} payload.content 消息体、内容等同 matrixClient.send 调用时参数的内容 // TODO扩充消息类型 现在暂时为消息内容
   * @param {String} payload.msgId 外挂根据时间戳生成的QQ消息唯一ID，用来去重
   * @param {String} payload.isDirect 是否是直聊房间
   * @returns
   * @memberof QBridge
   */
  async sendQQMsgToHs(payload) {
    const { sender, receiver, loginqq, content, msgId, isDirect } = payload;
    try {
      const response = await this.$http({
        method: 'PUT',
        url: `/api/v1/qbridge/send/${msgId}`,
        data: {
          sender: sender.toString(),
          receiver: receiver.toString(),
          loginqq: loginqq.toString(),
          content: {
            body: content,
            msgtype: 'm.text',
          },
          is_direct: isDirect,
        },
      });
      // console.log('sendQQMsgToHs', sender, receiver, content, isDirect, response.data);
      return response.data;
    } catch (error) {
      // console.log(error);
    }
  }

  /**
   * 调用外挂劫持QQ向某人或者某群发送消息
   * TODO 扩展消息类型
   * TODO 发送时生成假消息（在调用这个方法之前生成）
   * @param {*} toQQ 接收者QQ号或者群号
   * @param {string} strMsg 消息内容
   * @param {number} chatType 1-私聊 2-群聊
   * @memberof QBridge
   */
  makeQQsendMsg(payload) {
    const { toQQ, strMsg, chatType } = payload;
    // console.log('调用外挂给QQ发消息 toqq:', toQQ, '消息内容:', strMsg, 'chatType:', chatType);
    const msgContent = this.encodeMsg(strMsg);
    const req = new proto.QQHook.SendQQMessage();
    const msg = new proto.QQHook.QQMessage();
    msg.setChattype(chatType);
    msg.setMsgtype(proto.QQHook.QQMsgType.TEXT);
    msg.setToqq(toQQ);
    msg.setMsg(msgContent); // 这里需要转码为gb2312
    req.setQqmsg(msg);
    clientBus.post2('QQHook.SendQQMessage', req).then((reply) => {
      // console.log(reply.toObject());
    }).catch((err) => {
      // console.log(err);
    });
  }

  async handleQmsg(data) {
    if (data instanceof proto.QQHook.QQMessage) {
      const msgObj = data.toObject();
      msgObj.msg = this.decodeMsg(msgObj.msg);
      // console.log('proto.QQHook.QQMessage from QQ 外挂', msgObj, msgObj.msg);
      // TODO loginQQ !== bindQQ 跳过
      // const fqid = window.localStorage.getItem('fqid');
      // if (fqid && fqid.match(/\d+/)[0] !== msgObj.loginqq.toString()) return;
      this.sendQQMsgToHs({
        sender: msgObj.fromqq,
        receiver: msgObj.toqq,
        loginqq: msgObj.loginqq,
        content: msgObj.msg,
        isDirect: msgObj.chattype === 1,
        msgId: msgObj.msgid,
      });
    } else {
      // console.log('other msg from QQ 外挂', data.toObject());
    }
  }

  decodeMsg(base64msg) {
    return iconv.decode(Buffer.from(base64msg, 'base64'), 'gb2312');
  }

  encodeMsg(strMsg) {
    return Buffer.from(iconv.encode(strMsg, 'gb2312')).toString('base64');
  }
}

const qBridge = new QBridge();
window.qBridge = qBridge;

module.exports = qBridge;
module.exports.default = qBridge;
