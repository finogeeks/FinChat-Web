import 'pinyin4js';
import _ from 'lodash';

// const { PinyinHelper, PinyinFormat } = window;
const { PinyinHelper, PinyinFormat } = global;

// 检测 term 中是否含有中文字符。
function hasChinese(term) {
  if (/.*[\u4e00-\u9fa5]+.*$/.test(term)) {
    return true;
  }
  return false;
}

// 检测 target 中是否包含 term
function targetHasTerm(target, term) {
  if (target.toLowerCase().includes(term.toLowerCase())) {
    return true;
  }
  return false;
}

/**
 *
 * @param {[]} pinyinTransferArr [qi, qiu, hao]
 * @param {[]} originArr ['齐', '秋', '灏']
 * @param {string} searchTerm qiu
 *
 * @returns [{
 *    match: false,
 *    word: '齐',
 *    transfer: 'qi'
 * }, {
 *    match: true,
 *    word: '秋',
 *    transfer: 'qiu'
 * }, {
 *    match: false,
 *    word: '灏',
 *    transfer: 'hao'
 * }]
 */
function processSearchArr(pinyinTransferArr, originArr, searchTerm) {
  const searchRes = [];
  let preMatchWord = '';

  let pinyinArrPointer = 0;

  while (pinyinArrPointer < pinyinTransferArr.length) {
    const originWord = originArr[pinyinArrPointer];
    const pinyinWord = pinyinTransferArr[pinyinArrPointer];
    let restTerm = searchTerm.replace(new RegExp(preMatchWord, 'i'), '');
    if (!restTerm) {
      preMatchWord = '';
      restTerm = searchTerm;
    }
    const curMatch = pinyinWord.length >= restTerm.length ? _.startsWith(pinyinWord.toLowerCase(), restTerm.toLowerCase()) : _.startsWith(restTerm.toLowerCase(), pinyinWord.toLowerCase());
    if (curMatch) {
      preMatchWord += pinyinWord.length >= restTerm.length ? restTerm : pinyinWord;
      const nextResTerm = searchTerm.replace(preMatchWord, '');
      if (nextResTerm && pinyinArrPointer + 1 === pinyinTransferArr.length) {
        searchRes.push({
          match: false,
          word: originWord,
          transfer: pinyinWord,
        });
      } else {
        searchRes.push({
          match: true,
          word: originWord,
          transfer: pinyinWord,
        });
      }
      pinyinArrPointer += 1;
    } else {
      if (restTerm !== searchTerm) {
        let pointer = pinyinArrPointer - 1;

        while (restTerm !== searchTerm && pointer >= 0 && searchRes[pointer].match === true) {
          searchRes[pointer].match = false;
          restTerm = `${searchRes[pointer].transfer}${restTerm}`;
          pointer -= 1;
        }
      } else {
        searchRes.push({
          match: false,
          word: originWord,
          transfer: pinyinWord,
        });
        pinyinArrPointer += 1;
      }
      preMatchWord = '';
    }
  }

  const hasMatch = searchRes.reduce((pre, cur) => pre || cur.match, false);

  return {
    match: hasMatch,
    searchRes,
  };
}


function getSearchRes(searchTarget, searchTerm, pinyinModel = 'none') {
  let searchTargetValue = searchTarget;
  const searchTargetSplitArr = [...searchTarget];

  let searchTargetPinyinArr = null;

  switch (pinyinModel) {
    case 'none': break;
    case 'normal':
      searchTargetPinyinArr = searchTargetSplitArr.map((word) => {
        if (hasChinese(word)) {
          return PinyinHelper.convertToPinyinString(word, '', PinyinFormat.WITHOUT_TONE);
        }
        return word;
      });
      searchTargetValue = searchTargetPinyinArr.reduce((pre, cur) => `${pre}${cur}`, '');
      break;
    case 'short':
      searchTargetValue = PinyinHelper.getShortPinyin(searchTarget);
      searchTargetPinyinArr = searchTargetValue.split('');
      break;
    default: break;
  }

  if (!targetHasTerm(searchTargetValue, searchTerm)) {
    return {
      match: false,
      searchRes: [],
    };
  }

  const pinyinTransferArr = pinyinModel === 'none' ? searchTargetSplitArr : searchTargetPinyinArr;

  return processSearchArr(pinyinTransferArr, searchTargetSplitArr, searchTerm);
}

function search(term, target) {
  if (typeof term !== 'string' || typeof target !== 'string') {
    console.error('value and target must be string');
    return {
      match: false,
      searchRes: [],
    };
  }

  const searchTerm = term.trim();
  const searchTarget = target.trim();

  // 若搜索目标为空
  if (!searchTarget || !searchTerm) {
    return {
      match: false,
      searchRes: [],
    };
  }

  // 如果 '搜索关键字' 成功匹配
  if (targetHasTerm(searchTarget, searchTerm)) {
    return getSearchRes(searchTarget, searchTerm);
  }

  // 若 ’搜索关键字' 没有匹配中且 ’搜索关键字' 包含有 '中文字符'
  if (hasChinese(searchTerm)) {
    return {
      match: false,
      searchRes: [],
    };
  }

  // 若 ’搜索关键字' 没有匹配中，且 ’搜索关键字' 只有 '英文字符' 则进行 '拼音' 匹配
  const res = getSearchRes(searchTarget, searchTerm, 'normal');
  if (res.match) {
    return res;
  }

  // 若 '拼音' 未匹配中，则匹配 '首字母'
  return getSearchRes(searchTarget, searchTerm, 'short');
}


export default search;
