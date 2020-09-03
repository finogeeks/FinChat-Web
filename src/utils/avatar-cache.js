import emitter from '@/utils/event-emitter';
import cacheManager from '@/utils/cache';

class AvatarCache {
  constructor() {
    this.caches = {};
    this.ignore = {};
    this.$matrix = null;
    this.pendingUsers = [];
    this.isPendingUser = false;
    this.updatingUsers = [];
    this.isUpdatingUser = false;
  }

  setMatrix(matrix) {
    this.$matrix = matrix;
  }

  excludeCharacter(str) {
    return str.replace(/@|:|\.|!/ig, '');
  }

  getUserAvatar(userId, avatarUrl) {
    if (this.ignore[userId] >= 3) {
      return '';
    }
    if (!this.caches[userId] && avatarUrl) {
      this.pendingUsers.push([userId, avatarUrl]);
    }
    this.processPendingUser();
    return this.caches[userId] || avatarUrl;
  }

  updateUserAvatar(userId, avatarUrl) {
    // Mark: if has avatarUrl need to be update, clean the cache reference so that we can get new url before we cache the file
    if (avatarUrl) {
      if (this.caches[userId]) {
        window.URL.revokeObjectURL(this.caches[userId]);
        this.caches[userId] = null;
      }
    }
    this.updatingUsers.push([userId, avatarUrl]);
    this.processUpdatingUser();
  }

  async processPendingUser() {
    if (this.pendingUsers.length === 0 || this.isPendingUser) {
      return;
    }
    this.isPendingUser = true;
    const pendingList = [].concat(this.pendingUsers);
    for (let i = 0; i < pendingList.length; i += 1) {
      const [userId, avatarUrl] = pendingList[i];
      try {
        if (!this.caches[userId]) {
          await this.getUserAvatarAsync(userId, avatarUrl); //eslint-disable-line
        }
      } catch (error) {
        // console.log(error);
      }
    }
    this.pendingUsers = [];
    this.isPendingUser = false;
  }

  async processUpdatingUser() {
    if (this.updatingUsers.length === 0 || this.isUpdatingUser) {
      return;
    }
    this.isUpdatingUser = true;
    const updatingUsers = [].concat(this.updatingUsers);
    for (let i = 0; i < updatingUsers.length; i += 1) {
      const [userId, avatarUrl] = updatingUsers[i];
      if (!this.ignore[userId] || this.ignore[userId] < 3) {
        try {
          await this.updateUserAvatarAsync(userId, avatarUrl); //eslint-disable-line
          emitter.emit(`AVATAR_UPDATED_${userId}`, this.caches[userId]);
        } catch (error) {
          // console.log(error);
        }
      }
    }
    this.updatingUsers = [];
    this.isUpdatingUser = false;
  }

  async getUserAvatarAsync(userId, avatarUrl) {
    if (this.ignore[userId] >= 3) {
      return '';
    }
    const cacheKey = this.excludeCharacter(userId);
    try {
      const url = await this.getCache(cacheKey, avatarUrl);

      this.caches[userId] = url;
      return url;
    } catch (error) {
      const ignore = this.ignore[userId];
      this.ignore[userId] = ignore ? ignore + 1 : 1;
      return '';
    }
  }

  async updateUserAvatarAsync(userId, avatarUrl) {
    const cacheKey = this.excludeCharacter(userId);
    const url = await this.setCache(cacheKey, avatarUrl);
    if (this.caches[userId]) {
      window.URL.revokeObjectURL(this.caches[userId]);
    }
    this.caches[userId] = url;
  }

  async getCache(cacheKey, url) {
    try {
      const cache = await cacheManager.get(cacheKey);
      return this.covertFileToBlob(`file://${cache.path}`);
    } catch (error) {
      if (url) {
        return this.setCache(cacheKey, url);
      }
      return url;
    }
  }

  async setCache(cacheKey, url) {
    const fileName = `${cacheManager.namespace}/Avatar/${cacheKey}`;
    try {
      const cache = await cacheManager.set(cacheKey, {
        url: this.$matrix ? this.$matrix.mxcTransfer(url) : url,
        fileName,
      });
      return this.covertFileToBlob(`file://${cache.path}`);
    } catch (error) {
      throw error;
    }
  }

  async covertFileToBlob(fileUrl) {
    const fileRequest = new Request(fileUrl);
    const response = await fetch(fileRequest);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }
}

const avatarCache = new AvatarCache();

// module.exports = avatarCache;
// module.exports.default = avatarCache;

export {
  avatarCache,
}

