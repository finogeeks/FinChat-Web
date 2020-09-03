class DownloadManager {
  constructor(userId) {
    this.userId = userId;
    this.callBackIds = {};
    window.onDownloadMessage = (data) => {
      if (data.id && this.callBackIds[data.id]) {
        const res = { ...data };
        delete res.callBackId;
        if (res.error || isNaN(res.percent)) {
          this.callBackIds[data.id].onEnd(res);
          delete this.callBackIds[data.id];
        } else {
          this.callBackIds[data.id].onProgress(res, this.callBackIds[data.id].cancel);
        }
      }
    };
  }

  download(params, progressCallBack = () => {}) {
    if (typeof window.finstation !== 'object') {
      return Promise.reject();
    }
    return new Promise((resolve, reject) => {
      const callBackId = `download-${new Date().getTime()}`;
      const res = window.finstation.download({
        ...params,
        customHeaders: {
          'X-Consumer-Custom-ID': this.userId,
        },
        id: callBackId,
      }, Buffer.isBuffer(params.buffer));
      let cancel = null;
      if (res && typeof res.cancel === 'function') {
        cancel = res.cancel;
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

export default DownloadManager;
