class CacheManager {
  constructor() {
    this.userId = null;
    this.namespace = null;
    window.onFileCacheMessage = (data) => {
      if (data.callBackId && this.callBackIds[data.callBackId]) {
        const res = { ...data };
        delete res.callBackId;
        if (res.type === 'get' && typeof this.callBackIds[data.callBackId] === 'function') {
          this.callBackIds[data.callBackId](res);
          delete this.callBackIds[data.callBackId];
        } else if (res.type === 'set') {
          if (res.error || isNaN(res.percent)) {
            this.callBackIds[data.callBackId].onEnd(res);
            delete this.callBackIds[data.callBackId];
          } else {
            this.callBackIds[data.callBackId].onProgress(res, this.callBackIds[data.callBackId].cancel);
          }
        }
      }
    };
    this.callBackIds = {};
  }

  initNameSpace(userId) {
    this.userId = userId;
    this.namespace = userId.replace(/@|:|\./ig, '');
  }

  get(key) {
    if (typeof window.finstation !== 'object' || !this.namespace) {
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const callBackId = Date.now();
      window.finstation.getCache({ key, callBackId });
      this.callBackIds[callBackId] = (data) => {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data);
        }
      };
    });
  }

  set(key, params, progressCallBack = () => {}) {
    if (typeof window.finstation !== 'object' || !this.namespace) {
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const callBackId = Date.now();
      const res = window.finstation.setCache({
        key,
        ...params,
        customHeaders: {
          'X-Consumer-Custom-ID': this.userId,
        },
        callBackId,
      });
      let cancel = null;
      if (res && typeof res.cancel === 'function') {
        cancel = () => {
          res.cancel();
          reject('cancel');
        };
      } else {
        cancel = () => {};
      }
      this.callBackIds[callBackId] = {
        cancel,
        onProgress: progressCallBack,
        onEnd: (data) => {
          if (data.error) {
            reject(data.error);
          } else {
            resolve(data);
          }
        },
      };
    });
  }
}

export default new CacheManager();
