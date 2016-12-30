define(function(require, exports, module) {
    const { NUMBER } = require('/js/constant/index');
    const api = require('../api/index');

    let wallpaper = '';
    let $body = $('body');

    function updateWallpaper(url, save) {
        if (!url) {
            return;
        }

        wallpaper = url;

        if (save) {
            window.localStorage.setItem('wallpaper', url);
        }

        $body.css('background-image', `url(${url})`);
    }

    function refreshWallpaper() {
        api.bing.rand().then((resp) => {
            updateWallpaper(resp.data.url, true);
        });
    }

    exports.refreshWallpaper = refreshWallpaper;

    exports.init = function() {
        // restore
        let defaultWallpaper = window.localStorage.getItem('wallpaper');

        if (!defaultWallpaper) {
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
