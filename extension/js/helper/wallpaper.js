import STORAGE from '../constant/storage'
import browser from 'webextension-polyfill'
import util from '../common/util'
import _ from 'underscore'

export function saveWallpaperLink(url) {
    return util.isStorageSafe(STORAGE.WALLPAPERS).then(() => {
        return browser.storage.sync.get(STORAGE.WALLPAPERS).then(resp => {
            let wallpapers = resp[STORAGE.WALLPAPERS] || [];

            if (url) {
                if (wallpapers.indexOf(url) === -1) {
                    wallpapers.push(url);
                    wallpapers = _.uniq(wallpapers);

                    return {
                        [STORAGE.WALLPAPERS]: wallpapers
                    };
                } else {
                    return Promise.reject('Duplicate wallpaper!');
                }
            } else {
                return Promise.reject('Url is empty!');
            }
        })
        .then(newResults => browser.storage.sync.set(newResults));
    });
}

export function getDataURI(url) {
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

            resolve(canvas.toDataURL("image/jpeg"));
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
                [STORAGE.WALLPAPERS]: wallpapers
            });
            return browser.storage.sync.set({
                [STORAGE.WALLPAPERS]: wallpapers
            });
        } else {
            return Promise.resolve('no wallpapers');
        }
    }
}