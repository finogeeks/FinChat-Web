const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

const getCompressRatio = (ow, oh, mw, mh) => {
  let wratio = 1;
  let hratio = 1;
  if (ow > mw) {
    wratio = (mw / ow) * 1.0;
  }
  if (oh > mh) {
    hratio = (mh / oh) * 1.0;
  }
  return wratio > hratio ? hratio : wratio;
};

const getImageInfo = async (fileBlob) => {
  const img = document.createElement('img');
  const imageInfo = await new Promise((resolve) => {
    img.onerror = () => {
      resolve();
    };
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.src = window.URL.createObjectURL(fileBlob);
  });
  img && img.remove();
  return imageInfo;
};

const getThumbVideo = async (fileBlob, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT) => {
  const canvas = document.createElement('canvas');
  const video = document.createElement('video');
  const videoInfo = await new Promise((resolve) => {
    video.onerror = () => {
      // reject('不支持的视频格式');
      resolve();
    };
    video.onloadeddata = () => {
      const ratio = getCompressRatio(video.videoWidth, video.videoHeight, maxWidth, maxHeight);
      const thumbnailWidth = Math.floor(video.videoWidth * ratio);
      const thumbnailHeight = Math.floor(video.videoHeight * ratio);
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      canvas.getContext('2d').clearRect(0, 0, thumbnailWidth, thumbnailHeight);
      canvas.getContext('2d').drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
      window.URL.revokeObjectURL(video.src);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({
            blob,
            info: {
              mimetype: blob.type,
              size: blob.size,
              w: thumbnailWidth,
              h: thumbnailHeight,
            },
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration,
          });
        }
        resolve();
      });
    };
    video.src = window.URL.createObjectURL(fileBlob);
  });
  // remove the node
  video && video.remove();
  canvas && canvas.remove();
  return videoInfo;
};

const getBlobFromBase64 = base64Data => new Promise((resolve) => {
  const onSuccess = (blob) => {
    blob.name = 'image.png';
    resolve(blob);
  };
  const img = new Image();
  img.onerror = onerror;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(onSuccess);
    if (canvas) {
      canvas.remove();
    }
  };
  img.src = base64Data;
});

export default {
  getCompressRatio,
  getImageInfo,
  getThumbVideo,
  getBlobFromBase64,
}
