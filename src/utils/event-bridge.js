// // 先定义在这里，后续考虑抽出来

// const { ipcRenderer } = window.finstation;
// const EVENT_BRIDGE = '_EventBridge';
// class EventBridge {
//   constructor() {
//     this.listeners = new Map();
//     this.callProxy = (proxyname, ...args) => {
//       const random = `_proxy.${Date.now()}${Math.random().toString().substr(2, 10)}.${proxyname}`;
//       const result = this.once(random);
//       this.emit(`_proxy.${proxyname}`, {
//         event: random,
//         params: args,
//       });
//       return result;
//     };
//     this.proxy = new Proxy({}, {
//       get: (target, key) => this.callProxy.bind(this, key),
//     });

//     ipcRenderer.on(EVENT_BRIDGE, (event, args) => {
//       if (args.type === 'emit') {
//         const { eventName, payload } = args;
//         this.emit(eventName, payload, true);
//       }
//     });
//   }

//   /**
//    * @param {String} eventName 事件名
//    * @callback callback 回调函数
//    */
//   on(eventName, callback) {
//     // 容错性处理，有没有更加优雅的写法？
//     let _eventName = 'defaultEventName';
//     if (eventName && eventName.toString) {
//       _eventName = (eventName.toString() || _eventName);
//     }
//     if (typeof callback !== 'function') {
//       throw new Error('the second argument must be a function');
//     }

//     if (!this.listeners.has(_eventName)) {
//       this.listeners.set(_eventName, new Set());
//     }
//     const event = this.listeners.get(_eventName);
//     let hasCallback = false;
//     event.forEach((e) => {
//       if (e.cb === callback) { hasCallback = true; }
//     });
//     if (!hasCallback) { event.add({ cb: callback, isOnce: false }); }
//   }

//   /**
//    * @param {String} eventName 事件名
//    * @param {String|Object} payload 发送数据
//    * @param {String|Array} [to] 发送至哪几个窗口，默认为当前窗口，'*'代表广播
//    */
//   emit(eventName, payload, fromRemote = false) {
//     console.log('emit', eventName, payload, fromRemote);
//     if (!fromRemote) {
//       ipcRenderer.send(EVENT_BRIDGE, {
//         type: 'emit',
//         eventName,
//         payload,
//         windowId: window.finstation.winId,
//       });
//     }
//     if (this.listeners.has(eventName)) {
//       const event = this.listeners.get(eventName);
//       event.forEach((e) => {
//         e.cb(payload);
//         if (e.isOnce) {
//           this.remove(eventName, e.cb);
//         }
//       });
//     } else {
//       console.warn(`[${eventName}] has no listeners`);
//     }
//   }

//   /**
//    * @param {String} eventName 事件名
//    * @callback [callback] 回调函数
//    */
//   once(eventName, callback) {
//     let _callback;
//     return new Promise((resolve, reject) => {
//       if (!callback) {
//         _callback = (payload) => {
//           if (payload && payload._isRejected) {
//             reject(payload.payload);
//           } else if (payload && payload._isRejected === false) {
//             resolve(payload.payload);
//           } else {
//             resolve(payload);
//           }
//         };
//       } else {
//         _callback = callback;
//         resolve();
//       }
//       if (!this.listeners.has(eventName)) {
//         this.listeners.set(eventName, new Set());
//       }
//       const event = this.listeners.get(eventName);
//       let hasCallback = false;
//       event.forEach((e) => {
//         if (e.cb === callback) { hasCallback = true; }
//       });
//       if (!hasCallback) { event.add({ cb: _callback, isOnce: false }); }
//     });
//   }

//   remove(eventName, callback) {
//     const event = this.listeners.get(eventName);
//     if (!event) { return; }
//     if (callback) {
//       event.forEach((e) => {
//         if (e.cb === callback) {
//           event.delete(e);
//         }
//       });
//     }
//   }

//   removeAll(eventName) {
//     const event = this.listeners.get(eventName);
//     if (!event) { return; }
//     this.listeners.delete(eventName);
//   }

//   registerProxy(eventName, fn) {
//     this.unregisterProxy(eventName);
//     this.on(`_proxy.${eventName}`, async (payload) => {
//       const { event, params } = payload;
//       try {
//         if (typeof fn === 'function') {
//           const result = await fn(...params);
//           this.emit(event, {
//             payload: result,
//             _isRejected: false,
//           });
//         }
//       } catch (error) {
//         this.emit(event, {
//           payload: error,
//           _isRejected: true,
//         });
//       }
//     });
//   }

//   unregisterProxy(eventName) {
//     this.removeAll(`_proxy.${eventName}`);
//   }
// }

// const bridge = new EventBridge();

// /**
//  * 使用方法
//  *
//  * import eb from '@/utils/event-bridge';
//  *
//  * 监听指定事件
//  * eb.on('test', console.log);
//  *
//  * 监听指定事件并在收到事件后销毁
//  * eb.once('test', console.log);
//  *
//  * 如果 once 方法不加回调函数，会将结果以 Promise 的形式返回
//  * const result = await eb.once('test');
//  *
//  * 发送事件
//  * eb.emit('test', 'this is payload');
//  * eb.emit('test', { payload: 'hello world' });
//  *
//  * 删除单个监听的事件
//  * eb.remove('test', fn);
//  *
//  * 删除所有监听的事件
//  * eb.removeAll('test', fn);
//  *
//  * 注册一个函数代理
//  * eb.registerProxy('abcd', fn);
//  *
//  * 调用函数代理
//  * const result = await eb.proxy.abcd(foo, bar);
//  * 相当于将 fn(foo, bar) 的结果给 result
//  * 注意，跨进程传输过程中，参数如果是 undefined 会变成 null，在使用函数的参数默认值时需要注意此问题
//  */

// export default bridge;
