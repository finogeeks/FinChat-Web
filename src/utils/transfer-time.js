import moment from 'moment';

const oneSec = 1000;
const oneMin = 60 * oneSec;
const oneHour = 60 * oneMin;
const oneDay = 24 * oneHour;
const oneWeek = 7 * oneDay;
const oneYear = 365 * oneDay;

function transferTime(time) {
  if (!time) return '';

  const now = new Date();
  const today = new Date().setHours(0, 0, 0);
  const dawn = new Date().setHours(6, 0, 0);
  const morning = new Date().setHours(12, 0, 0);
  const afternoon = new Date().setHours(18, 0, 0);

  const diff = now - time;

  const isToday = time - today < oneDay && time > today;
  const isDawn = time - today < dawn - today;
  const isMorning = time - today < morning - today;
  const isAfternoon = time - today < afternoon - today;

  if (diff < oneMin) {
    return '刚刚';
  }

  if (diff < 30 * oneMin) {
    return `${Math.floor(diff / oneMin)}分钟前`;
  }
  const mTime = moment(time).locale('zh-cn');
  if (isToday) {
    if (isDawn) {
      return `凌晨${mTime.format('HH:mm')}`;
    }
    if (isMorning) {
      return `上午${mTime.format('h:mm')}`;
    }
    if (isAfternoon) {
      return `下午${mTime.format('h:mm')}`;
    }
    return `晚上${mTime.format('h:mm')}`;
  }

  if (today - time < oneDay) {
    return '昨天';
  }

  if (today - time < oneWeek) {
    const day = mTime.format('d');
    let chineseDay = '';
    switch (day) {
      case '0':
        chineseDay = '天';
        break;
      case '1':
        chineseDay = '一';
        break;
      case '2':
        chineseDay = '二';
        break;
      case '3':
        chineseDay = '三';
        break;
      case '4':
        chineseDay = '四';
        break;
      case '5':
        chineseDay = '五';
        break;
      case '6':
        chineseDay = '六';
        break;
      default: break;
    }
    return `星期${chineseDay}`;
  }

  const lastYear = new Date();
  lastYear.setHours(0, 0, 0);
  lastYear.setDate(1);
  lastYear.setMonth(1);

  if (time > lastYear.getTime()) {
    return mTime.format('M/D');
  }

  return mTime.format('YY/M/D');
}

export default transferTime;
