import $ from 'jquery'
import { NUMBER } from '../constant/index'
import * as api from '../api/index'
import * as date from '../utils/date'
import _ from 'underscore'
import storage from '../utils/storage'

const STORAGE_KEY = 'wallpapers';

let wallpaper = '';
let $body = $('body');
let curUrl = '';

function updateWallpaper(url, save) {
    if (!url) {
        return;
    }

    if (save) {
        window.localStorage.setItem('wallpaper', url);
    }

    curUrl = url;
    $body.css('background-image', `url(${url})`);
}

function saveWallpaperLink() {
    storage.sync.get(STORAGE_KEY, []).then(wallpapers => {
        if (curUrl) {
            wallpapers.push(curUrl);
            wallpapers = _.uniq(wallpapers);
        }

        console.log(wallpapers);

        return {
            [STORAGE_KEY]: wallpapers
        };
    }).then(newResults => storage.sync.set(newResults)).then(resp => {
        alert('save successfully');
    });
}

export function refreshWallpaper(today) {
    let method = today ? 'today' : 'rand';

    api.bing[method]().then((resp) => {
        updateWallpaper(api.bing.root + resp.images[0].url, true);
    }).catch(resp => {
        console.log(resp);
    });
}

export function init() {
    // restore
    const lastDate = new Date(window.localStorage.getItem('lastDate') || +new Date);
    const defaultWallpaper = window.localStorage.getItem('wallpaper');

    window.localStorage.setItem('lastDate', date.format());

    if (date.isNewDate(new Date(), lastDate)) {
        refreshWallpaper(true);
    } else if (!defaultWallpaper) {
        refreshWallpaper();
    } else {
        updateWallpaper(defaultWallpaper);
    }

    // bind events
    $('#j-refresh-wp').on('click', function() {
        refreshWallpaper();
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'refresh']);
    });

    $('#j-save-wplink').on('click', function() {
        saveWallpaperLink();
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'save']);
    });

    // set interval
    setInterval(refreshWallpaper, NUMBER.WALLPAPER_INTERVAL);
}