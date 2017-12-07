/*global _gaq*/
import $ from 'jquery'
import CONST from '../constant'
import * as api from '../api/index'
import * as date from '../utils/date'
import storage from '../utils/storage'
import Toast from 'toastr'
import { saveWallpaperLink } from '../helper/wallpaper'
import browser from 'webextension-polyfill'

const $body = $('body');

let curUrl = '';
let intervalTimer = 0;
let $saveBtn;

function updateWallpaper(url, save, isNew) {
    if (!url) {
        return;
    }

    if (save) {
        window.localStorage.setItem(CONST.STORAGE.WALLPAPER, url);
    }

    if (isNew) {
        $saveBtn.show();
    } else {
        $saveBtn.hide();
    }

    curUrl = url;
    $body.css({
        'background': `url(${url}) no-repeat center center fixed`,
        'background-size': 'cover'
    });
    $body.trigger('wallpaper:refreshed');
}


function randomIndex() {
    const sourceWeights = [1, 2, 2];
    const list = [];

    sourceWeights.forEach((weight, index) => {
        for (let windex = 0; windex < weight; windex += 1) {
            list.push(index);
        }
    });

    return getRandomOne(list);
}

function wallpaperApiHandler(resp, isBing) {
    console.log(`update from ${isBing ? 'bing' : 'cache'}...`);
    if (!isBing) {
        return resp;
    } else {
        return api.bing.root + resp.images[0].url;
    }
}

function getRandomOne(list) {
    if (list && list.length) {
        const index = Math.round(Math.random() * (list.length - 1));

        return list[index];
    }
}

export function refreshWallpaper(today) {
    const method = today ? 'today' : 'rand';

    Promise.all([
        api.bing[method](),
        storage.sync.get(CONST.STORAGE.WALLPAPERS, []),
        api.picsum.getRandomImage()
    ]).then(source => {
        const index = randomIndex();
        const [bing, cache, picsum] = source;

        if (index === 2) {
            const isNew = cache.indexOf(picsum) === -1;

            updateWallpaper(picsum, true, isNew);
            console.log('update from picsum');
        } else if (index === 1 && source[index].length > 0) {
            updateWallpaper(wallpaperApiHandler(getRandomOne(cache)), true, false);
        } else {
            const wp = wallpaperApiHandler(bing, true);
            const isNew = cache.indexOf(wp) === -1;

            updateWallpaper(wp, true, isNew);
        }
    }).catch(resp => {
        console.log(resp);
    });
}

function bindEvents() {
    $('#j-refresh-wp').on('click', function() {
        refreshWallpaper();
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'refresh']);
    });

    $saveBtn.on('click', function() {
        saveWallpaperLink(curUrl).then(() => {
            Toast.success('save successfully');
            $saveBtn.hide();
        }).catch(msg => {
            Toast.warning(msg);
        });
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'save']);
    });

    $(document).on('dblclick', function(event) {
        if (event.target.tagName === 'BODY') {
            clearInterval(intervalTimer);
            Toast.success('The automatic refresh of the wallpaper has been disabled');
        }
    });
}

export function init() {
    // restore
    const lastDate = new Date(window.localStorage.getItem(CONST.STORAGE.LASTDATE) || Number(new Date()));
    const defaultWallpaper = window.localStorage.getItem(CONST.STORAGE.WALLPAPER);

    $saveBtn = $('#j-save-wplink');

    window.localStorage.setItem(CONST.STORAGE.LASTDATE, date.format());

    if (date.isNewDate(new Date(), lastDate)) {
        refreshWallpaper(true);
    } else if (!defaultWallpaper) {
        refreshWallpaper();
    } else {
        browser.storage.sync.get(CONST.STORAGE.WALLPAPERS).then(resp => {
            const list = resp[CONST.STORAGE.WALLPAPERS] || [];
            const isNew = list.indexOf(defaultWallpaper) === -1;

            updateWallpaper(defaultWallpaper, false, isNew);
        });
    }

    bindEvents();

    api.picsum.refreshPicsumList();

    // set interval
    intervalTimer = setInterval(refreshWallpaper, CONST.NUMBER.WALLPAPER_INTERVAL);
}