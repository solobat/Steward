import STORAGE from '../constant/storage'
import browser from 'webextension-polyfill'
import util from '../common/util'
import _ from 'underscore'

export function initBgImg() {
    const wallpaper = localStorage.getItem(STORAGE.WALLPAPER);

    if (wallpaper) {
        document.body.style.background = `url(${wallpaper})`;
    }
}

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