/**
 * 机器人相关 API ，由于 js-SDK 正在迁移，暂时存放在这里
 * @module FinbotService
 */

import axios from 'axios';

class FinbotService {
  constructor() {
    this.bots = [];
  }

  async init(baseURL, userId, jwtToken, accessToken) {
    const instance = axios.create({
      baseURL,
      params: {
        jwt: jwtToken,
        access_token: accessToken,
      },
    });
    instance.defaults.headers.common['X-Consumer-Custom-ID'] = userId;
    instance.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
    this.$http = instance;
  }

  async fetchCommands(botId, levelParam = []) {
    try {
      const response = await this.$http({
        method: 'POST',
        url: `/api/v1/fc/bot/input/${botId}`,
        data: JSON.stringify({
          level_param: levelParam,
        }),
      });
      return response.data.messages;
    } catch (error) {
      // console.log(error);
    }
    return [];
  }

  async getBotInfo(botId) {
    try {
      const response = await this.$http({
        method: 'GET',
        url: `/api/v1/uac/bot/getBot/${botId}`,
      });
      return response.data;
    } catch (error) {
      // console.log(error);
    }
    return null;
  }
}

module.exports = FinbotService;
module.exports.default = FinbotService;
