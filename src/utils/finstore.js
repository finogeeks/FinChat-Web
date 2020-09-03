/**
 * 应用市场 API ，由于 js-SDK 正在迁移，暂时存放在这里
 * @module FinstoreService
 * */

import axios from 'axios';
import { BASE_URL } from '../commonVariable';

function Message(type, status, data) {
  return { type, status, data };
}

class FinstoreService {
  constructor() {
    this.isAdmin = false;
    this.isDeveloper = false;
    this.apps = [];
    this.jwt = '';
    this.userId = '';
  }

  async init(baseURL, userId, apiToken, accessToken) {
    const instance = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        access_token: accessToken,
      },
    });
    instance.defaults.headers.common['X-Consumer-Custom-ID'] = userId;
    instance.defaults.headers.post['Content-Type'] = 'application/json;charset=UTF-8';
    this.$axios = instance;
    this.jwt = apiToken;
    this.userId = userId;
  }

  async initUser(userInfo) {
    const response = await this.getUserInfo();
    if (response.status) {
      this.isAdmin = response.data.is_admin;
      this.isDeveloper = response.data.is_developer;
    }

    if (IS_PUBLIC && !this.isDeveloper) {
      await this.createUser({
        name: userInfo.displayName,
        icon: userInfo.avatar,
        secret: 'test',
      });
      this.isDeveloper = true;
    }
  }

  async getApps() {
    const defaultApps = [
      {
        id: 'net-disk',
        name: '网盘',
        url: 'http://api.finogeeks.club/desktop/publish/plugin-net-disk/home',
        icon: 'https://s1.ax1x.com/2018/10/31/iRcweU.png',
        powerLevel: 5,
      },
      {
        id: 'peer-transfer',
        name: '局域网传输',
        url: 'https://peer.finogeeks.club',
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      },
      /*
      {
        name: '消息群发',
        id: 'mass-message',
        url: VIEW_MASS_MESSAGE,
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      }
      */
    ];
    const response = await this.getAppList(this.userId);
    if (response.status) {
      const apps = response.data || [];
      this.apps = defaultApps.concat(apps.map(item => ({
        id: item.appId,
        icon: `${item.logo}?jwt=${this.jwt}`, // FIXME simply put jwt here would expose jwt to third party
        name: item.name,
        powerLevel: 'admin',
        url: item.customData.homepage,
        appType: item.appType,
        fcId: item.fcId,
      })));
      // old
      // this.apps = defaultApps.concat(response.data.map(item => ({
      //   id: item.app_id,
      //   botId: item.bot_id,
      //   category: item.category,
      //   companyId: item.company_id,
      //   companyName: item.company_name,
      //   createTime: item.create_time,
      //   creator: item.creator,
      //   description: item.description,
      //   extension: item.extension,
      //   icon: item.icon,
      //   intro: item.intro,
      //   marketStatus: item.market_status,
      //   name: item.name,
      //   platform: item.platform,
      //   powerLevel: item.power_level,
      //   thumbnails: item.thumbnails,
      //   updateTime: item.update_time,
      //   url: item.url,
      //   version: item.version,
      // })));
    } else {
      this.apps = defaultApps;
    }

    if (DEBUG) {
      const developApp = {
        id: 'develop-app',
        name: 'Develop App',
        url: VIEW_DEVELOP,
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      };
      const BIMApp = {
        id: 'bim',
        name: 'BIM 看板',
        url: VIEW_BIM,
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      };
      const TAMAppDev = {
        id: 'tam-dev',
        name: 'TAM DEV',
        url: 'http://129.204.116.51:30000/desktop/publish/tam/#/create',
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      };
      // demo 为演示环境！
      const TAMAppDemo = {
        id: 'tam-demo',
        name: 'TAM DEMO',
        url: 'http://139.199.192.190:30000/desktop/publish/tam/#/create',
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      };

      // 工单查看
      const ServiceAppDemo = {
        id: 'service-demo',
        name: '工单',
        url: `/plugin-service/`,
        // url: 'http://127.0.0.1:8081/plugin-service/',
        icon: 'https://s1.ax1x.com/2018/10/31/iRgnh9.png',
        powerLevel: 5,
      };

      this.apps = [
        developApp,
        BIMApp,
        TAMAppDev,
        TAMAppDemo,
        ServiceAppDemo,
        ...this.apps,
      ];
    }
    return this.apps;
  }

  /**
   * 创建用户
   */
  async createUser(params) {
    try {
      const response = await this.$axios({
        method: 'PUT',
        url: '/api/v1/finstore/public/user',
        data: params,
      });
      return Message('createUser', true, response.data);
    } catch (error) {
      return Message('createUser', false, error);
    }
  }

  /**
   * 修改用户
   */
  async updateUser(params) {
    try {
      const response = await this.$axios({
        method: 'PUT',
        url: '/api/v1/finstore/public/user',
        data: params,
      });
      return Message('updateUser', true, response.data);
    } catch (error) {
      return Message('updateUser', false, error);
    }
  }

  /**
   * 获取应用列表
   */
  async getAppList(userId) {
    try {
      const response = await this.$axios({
        method: 'GET',
        url: `/api/v1/finstore/apps?userId=${userId}&platform=PC&isOwner=true`,
      });
      const publicApps = await this.$axios({
        method: 'GET',
        url: `https://store.finogeeks.club/api/v1/finstore/apps?userId=${userId}&platform=PC&isOwner=true&organizationId=${IAM_CLIENT_ID}`,
      });
      return Message('getAppList', true, [...response.data.list, ...publicApps.data.list]);
    } catch (error) {
      return Message('getAppList', false, error);
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo() {
    try {
      const response = await this.$axios({
        method: 'GET',
        url: '/api/v1/finstore/public/user/me',
      });
      return Message('getUserInfo', true, response.data);
    } catch (error) {
      return Message('getUserInfo', false, error);
    }
  }
}

module.exports = FinstoreService;
module.exports.default = FinstoreService;

