/*global _gaq*/
import $ from 'jquery'
import CONST from '../constant'
import * as api from '../api/index'
import * as date from '../utils/date'
import storage from '../utils/storage'
import Toast from 'toastr'
import { saveWallpaperLink } from '../helper/wallpaper'

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
}

function randomBool() {
    return Boolean(Math.round(Math.random()));
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
        storage.sync.get(CONST.STORAGE.WALLPAPERS, [])
    ]).then(([bing, cache]) => {
        const isBing = randomBool();

        if (isBing || cache.length === 0) {
            const wp = wallpaperApiHandler(bing, true);
            const isNew = cache.indexOf(wp) === -1;

            updateWallpaper(wp, true, isNew);
        } else {
            updateWallpaper(wallpaperApiHandler(getRandomOne(cache)), true, false);
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
        updateWallpaper(defaultWallpaper, false, true);
    }

    bindEvents();

    // set interval
    intervalTimer = setInterval(refreshWallpaper, CONST.NUMBER.WALLPAPER_INTERVAL);
}