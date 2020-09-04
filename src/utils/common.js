export const isObjEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (let index = 0; index < keys1.length; index += 1) {
    if (obj1[keys1[index]] !== obj2[keys1[index]]) {
      return false;
    }
  }
  for (let index = 0; index < keys2.length; index += 1) {
    if (obj1[keys2[index]] !== obj2[keys2[index]]) {
      return false;
    }
  }
  return true;
};

export const isObjNull = obj => Object.keys(obj).length === 0;

export const checkURL = (url) => {
  const exp = /^http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?/;
  const objExp = new RegExp(exp);
  if (objExp.test(url)) {
    return true;
  }
  return false;
};

export const cloneDeep = obj => JSON.parse(JSON.stringify(obj));

export const isApp = () => {
  if (window.process && window.process.type && window.process.type === 'renderer') {
    return true;
  }
  return false;
};

export const getEmojiUrl = () => {
  if (window.finstation && typeof window.finstation.getStaticDir === 'function') {
    return `file://${window.finstation.getStaticDir()}/emojis/`;
  }
  return 'https://cdn.jsdelivr.net/emojione/assets/png/';
};

export const parseURL = (url) => {
  const a = document.createElement('a');
  a.href = url;
  return {
    source: url,
    protocol: a.protocol.replace(':', ''),
    host: a.hostname,
    port: a.port,
    query: a.search,
    params: (() => {
      const ret = {};
      const seg = a.search.replace(/^\?/, '').split('&');
      const len = seg.length;
      let i = 0;
      let s;
      for (; i < len; i += 1) {
        if (!seg[i]) {
          continue; //eslint-disable-line
        }
        s = seg[i].split('=');
        ret[s[0]] = s[1];
      }
      return ret;
    })(),
    hash: a.hash.replace('#', ''),
    path: a.pathname.replace(/^([^/])/, '/$1'),
    relative: (a.href.match(/tps?:\/\/[^/]+(.+)/) || [''])[1],
    segments: a.pathname.replace(/^\//, '').split('/'),
  };
};

export default {
  isObjEqual,
  isObjNull,
  checkURL,
  cloneDeep,
  getEmojiUrl,
  parseURL,
};
