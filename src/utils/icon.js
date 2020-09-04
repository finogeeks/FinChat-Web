/* eslint no-param-reassign: off */
import { Message } from '@finogeeks/finchat-model';

const prefix = '';

const icons = {
  // file
  pdf: `${prefix}static/assets/icon-file/ico_pdf.svg`,
  word: `${prefix}static/assets/icon-file/ico_doc_docx.svg`,
  excel: `${prefix}static/assets/icon-file/ico_xls_xlsx.svg`,
  powerpoint: `${prefix}static/assets/icon-file/ico_ppt_pptx.svg`,
  doc: `${prefix}static/assets/icon-file/ico_doc_docx.svg`,
  xls: `${prefix}static/assets/icon-file/ico_xls_xlsx.svg`,
  ppt: `${prefix}static/assets/icon-file/ico_ppt_pptx.svg`,
  key: `${prefix}static/assets/icon-file/ico_key.svg`,
  keynote: `${prefix}static/assets/icon-file/ico_key.svg`,
  archive: `${prefix}static/assets/icon-file/ico_rar_zip.svg`,
  archive7z: `${prefix}static/assets/icon-file/ico_7z.svg`,
  txt: `${prefix}static/assets/icon-file/ico_txt.svg`,
  file: `${prefix}static/assets/icon-file/ico_other.svg`,
  other: `${prefix}static/assets/icon-file/ico_other.svg`,

  // media
  address: `${prefix}static/assets/icon-media/ico_address.svg`,
  image: `${prefix}static/assets/icon-media/ico_img.svg`,
  url: `${prefix}static/assets/icon-media/ico_link.svg`,
  video: `${prefix}static/assets/icon-media/ico_video.svg`,
  audio: `${prefix}static/assets/icon-media/ico_voice.svg`, 

  // message status
  messageLoading: `${prefix}static/assets/icon-status/room_send_loading.gif`,
  messageError: `${prefix}static/assets/icon-status/room_send_error.svg`,
  messageCancel: `${prefix}static/assets/icon-status/room_send_stop.svg`,
  videoLoading: `${prefix}static/assets/icon-status/room_video_loaidng.svg`,
  videoPlay: `${prefix}static/assets/icon-status/room_video_play.svg`,
  videoPop: `${prefix}static/assets/icon-status/send_pop_video.svg`,
  imageError: `${prefix}static/assets/icon-status/room_image_error.svg`,

  // other
  folder: `${prefix}static/assets/ico_folder.svg`,
  download: `${prefix}static/assets/ic_download.svg`,
  share: `${prefix}static/assets/ic_share.svg`,
  more: `${prefix}static/assets/ic_more.svg`,
  error: `${prefix}static/assets/ic_error.svg`,
  success: `${prefix}static/assets/ic_success.svg`,
  up: `.static/assets/ico_up.svg`,
  down: `${prefix}static/assets/ico_down.svg`,
  add: `${prefix}static/assets/ic_add.svg`,
};

// m.file
icons[Message.types.file] = `${prefix}static/assets/icon-file/ico_file.svg`;
// m.image
icons[Message.types.image] = `${prefix}static/assets/icon-media/ico_img.svg`;
// m.url
icons[Message.types.url] = `${prefix}static/assets/icon-media/ico_link.svg`;
// m.video
icons[Message.types.video] = `${prefix}static/assets/icon-media/ico_video.svg`;
// m.audio
icons[Message.types.audio] = `${prefix}static/assets/icon-media/ico_voice.svg`;
// txt
icons[Message.types.txt] = `${prefix}static/assets/icon-file/ico_txt.svg`;


export const iconTypeMatcher = (extent) => {
  let type = '';
  switch (extent) {
    case 'pdf':
      type = 'pdf';
      break;

    case 'doc':
    case 'docx':
      type = 'word';
      break;

    case 'xls':
    case 'xlsx':
      type = 'excel';
      break;

    case 'ppt':
    case 'pptx':
      type = 'powerpoint';
      break;

    case 'key':
      type = 'keynote';
      break;

    case 'txt':
      type = 'txt';
      break;

    case 'zip':
    case 'rar':
      type = 'archive';
      break;

    case '7z':
      type = 'archive7z';
      break;

    case 'mp3':
    case 'amr':
      type = 'audio';
      break;

    case 'dmg':
      type = 'file';
      break;

    case 'js':
    case 'css':
    case 'html':
      type = 'code';
      break;

    default:
      type = extent;
      break;
  }
  return icons[type] || icons.file;
};
export default icons;
