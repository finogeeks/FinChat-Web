/**
 * Channel API ，由于 js-SDK 正在迁移，暂时存放在这里
 * @module ChannelService
 * */

import axios from 'axios';

function Message(type, status, data) {
  return { type, status, data };
}

export class ChannelService {
  constructor() {
    this.$axios = null;
  }

  async init(baseUrl, userId, jwt, accessToken) {
    this.userId = userId;
    const instance = axios.create({
      baseURL: baseUrl,
      timeout: 5000,
      params: {
        jwt,
        access_token: accessToken,
      },
    });
    instance.defaults.headers.common['X-Consumer-Custom-ID'] = userId;
    instance.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
    this.$axios = instance;
  }

  /**
   * 修改 topic
   */
  async updateTopic(params) {
    try {
      const response = await this.$axios({
        method: 'PUT',
        url: `/api/v1/channel/rooms/${params.roomId}/topic`,
        data: {
          topic: params.topic,
        },
      });
      return Message('updateTopic', true, response.data);
    } catch (error) {
      return Message('updateTopic', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 修改 Roomname
   */
  async updateName(params) {
    try {
      const response = await this.$axios({
        method: 'PUT',
        url: `/api/v1/channel/rooms/${params.roomId}/name`,
        data: {
          name: params.name,
        },
      });
      return Message('updateName', true, response.data);
    } catch (error) {
      return Message('updateName', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 归档频道
   */
  async archive(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: `/api/v1/channel/rooms/${params.roomId}/archive`,
      });
      return Message('archive', true, response.data);
    } catch (error) {
      return Message('archive', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 取消归档频道
   */
  async unArchive(params) {
    try {
      const response = await this.$axios({
        method: 'DELETE',
        url: `/api/v1/channel/rooms/${params.roomId}/archive`,
      });
      return Message('unArchive', true, response.data);
    } catch (error) {
      return Message('unArchive', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 添加验证机器人
   */
  async addVerify(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: '/api/v1/channel/verify/invite',
        data: {
          roomId: params.roomId,
        },
      });
      return Message('addVerify', true, response.data);
    } catch (error) {
      return Message('addVerify', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 查找已加入的所有频道(包括公开，私有，共享)
   */
  async getPublicRooms(params = {}) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: '/api/v1/channel/publicRooms',
        data: params,
      });
      return Message('getPublicRooms', true, response.data);
    } catch (error) {
      return Message('getPublicRooms', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 检查name是否可用
   */
  async checkName(params) {
    try {
      const response = await this.$axios({
        method: 'GET',
        url: `/api/v1/channel/checkname/${params.name}`,
      });
      return Message('checkName', true, response.data);
    } catch (error) {
      return Message('checkName', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 通过roomId查找频道详情
   */
  async getChannelDetail(params) {
    try {
      const response = await this.$axios({
        method: 'GET',
        url: `/api/v1/channel/channels/${params.roomId}`,
      });
      return Message('getChannelDetail', true, response.data);
    } catch (error) {
      return Message('getChannelDetail', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 创建频道
   */
  async createChannel(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: '/api/v1/channel/createRoom',
        data: params,
      });
      return Message('createChannel', true, response.data);
    } catch (error) {
      return Message('createChannel', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 自动加入一个私密房间（不能跨域） channel
   */
  async joinPrivateChannel(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: `/api/v1/channel/rooms/${params.roomId}/privateJoin`,
        data: params,
      });
      return Message('joinPrivateChannel', true, response.data);
    } catch (error) {
      return Message('joinPrivateChannel', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 邀请多人并自动加入 channel
   */
  async inviteMultiple(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: `/api/v1/channel/rooms/${params.roomId}/mutiInviteAndJoin`,
        data: params,
      });
      return Message('inviteMultiple', true, response.data);
    } catch (error) {
      return Message('inviteMultiple', false, error.response ? error.response.data : error);
    }
  }

  /**
   * 邀请并自动加入 channel
   */
  async invite(params) {
    try {
      const response = await this.$axios({
        method: 'POST',
        url: `/api/v1/channel/rooms/${params.roomId}/inviteAndJoin`,
        data: params,
      });
      return Message('invite', true, response.data);
    } catch (error) {
      return Message('invite', false, error.response ? error.response.data : error);
    }
  }
}

// module.exports = ChannelService;
// module.exports.default = ChannelService;

