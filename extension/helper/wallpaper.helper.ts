import _ from 'underscore';
import { browser } from 'webextension-polyfill-ts';

import util from 'common/util';
import STORAGE from 'constant/storage';

export type ACTION_TYPE = 'save' | 'remove'
export interface ACTION {
  action: ACTION_TYPE;
  msg: string
}

export const WALLPAPER_ACTIONS: {
  [props: string]: ACTION
} = {
  save: {
    action: 'save',
    msg: chrome.i18n.getMessage('wallpaper_save_done'),
  },

  remove: {
    action: 'remove',
    msg: chrome.i18n.getMessage('wallpaper_remove_done'),
  },
};

export function saveWallpaperLink(url: string, action: ACTION_TYPE = 'save') {
  return util.isStorageSafe(STORAGE.WALLPAPERS).then(() => {
    return browser.storage.sync
      .get(STORAGE.WALLPAPERS)
      .then(resp => {
        let wallpapers: any[] = resp[STORAGE.WALLPAPERS] || [];

        if (url) {
          const imgSaved = wallpapers.indexOf(url) !== -1;

          if (!imgSaved && action === 'save') {
            wallpapers.push(url);
            wallpapers = _.uniq(wallpapers);

            return {
              [STORAGE.WALLPAPERS]: wallpapers,
            };
          } else if (imgSaved && action === 'remove') {
            wallpapers.splice(wallpapers.indexOf(url), 1);

            return {
              [STORAGE.WALLPAPERS]: wallpapers,
            };
          } else {
            const msg =
              imgSaved && action === 'save'
                ? 'Duplicate wallpaper!'
                : 'Invalid action';

            return Promise.reject(msg);
          }
        } else {
          return Promise.reject('Url is empty!');
        }
      })
      .then(newResults => browser.storage.sync.set(newResults));
  });
}

export function getDataURI(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let img = new Image();

    img.onload = onLoad;
    img.onerror = onError;
    img.onabort = onError;
    img.crossOrigin = '*';
    img.src = url;

    function onLoad() {
      unbindEvent();

      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);

      resolve(canvas.toDataURL('image/jpeg'));
      canvas = null;
      img = null;
    }

    function onError(error) {
      unbindEvent();
      reject(error);
    }

    function unbindEvent() {
      img.onload = null;
      img.onerror = null;
      img.onabort = null;
    }
  });
}

const checkBlacklist = (
  predicate: (list: any[]) => boolean | any[] = Boolean,
) => (imgurl: string) => {
  return browser.storage.local.get(STORAGE.WALLPAPER_BLACKLIST).then(resp => {
    const list: any[] = resp[STORAGE.WALLPAPER_BLACKLIST] || [];

    if (list.indexOf(imgurl) === -1) {
      list.push(imgurl);

      return predicate(list);
    } else {
      return Promise.reject('');
    }
  });
};

export const shouldShow = checkBlacklist();

const getBlacklistIfNotRepeat = checkBlacklist(list => list);

export function addToBlackList(imgurl: string) {
  if (imgurl) {
    return getBlacklistIfNotRepeat(imgurl).then(list => {
      return browser.storage.local.set({
        [STORAGE.WALLPAPER_BLACKLIST]: list,
      });
    });
  } else {
    return Promise.reject('');
  }
}

export default {
  key: STORAGE.WALLPAPERS,

  saveWallpaperLink,
  getDataURI,

  getData() {
    return browser.storage.sync.get(STORAGE.WALLPAPERS).then(resp => {
      return resp[STORAGE.WALLPAPERS];
    });
  },

  setData(wallpapers) {
    if (wallpapers && wallpapers.length) {
      console.log({
        [STORAGE.WALLPAPERS]: wallpapers,
      });
      return browser.storage.sync.set({
        [STORAGE.WALLPAPERS]: wallpapers,
      });
    } else {
      return Promise.resolve('no wallpapers');
    }
  },
};
