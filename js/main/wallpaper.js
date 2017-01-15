define(function(require, exports, module) {
    const { NUMBER } = require('/js/constant/index');
    const api = require('../api/index');
    const date = require('/js/utils/date');

    let wallpaper = '';
    let $body = $('body');

    function updateWallpaper(url, save) {
        if (!url) {
            return;
        }

        if (save) {
            window.localStorage.setItem('wallpaper', url);
        }

        $body.css('background-image', `url(${url})`);
    }

    function refreshWallpaper(today) {
        let method = today ? 'today' : 'rand';

        api.bing[method]().then((resp) => {
            updateWallpaper(api.bing.root + resp.images[0].url, true);
        }).catch(resp => {
            console.log(resp);
        });
    }

    exports.refreshWallpaper = refreshWallpaper;

    exports.init = function() {
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
        $('#j-refresh-wp').on('click', refreshWallpaper);

        // set interval
        setInterval(refreshWallpaper, NUMBER.WALLPAPER_INTERVAL);
    }
});
