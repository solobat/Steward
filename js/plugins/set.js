/**
 * @file set command script
 * @description open extension's option page
 * @author  tomasy
 * @mail solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');

    var name = 'setOption';
    var key = 'set';
    var icon = chrome.extension.getURL('img/set.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function openOptionPage(id, elem, cb) {
        var url = $(elem).data('url');

        if (!url) {
            cb.call(null);
            return;
        }

        chrome.tabs.create({
            url: url
        }, function () {
            cb.call(null);
        });
    }

    // get all
    function getExtensions(key, enabled, callback) {
        chrome.management.getAll(function (extList) {
            var matchExts = extList.filter(function (ext) {
                return !ext.isApp && ext.enabled === enabled && util.matchText(key, ext.name);
            });

            callback(matchExts);
        });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            var url = item.icons instanceof Array ? item.icons[item.icons.length - 1].url : '';
            var isWarn = item.installType === 'development';
            return {
                key: key,
                id: item.id,
                icon: url,
                title: item.name,
                url: item.optionsUrl,
                desc: item.description,
                isWarn: isWarn

            };
        });
    }
    function onInput(key) {
        var that = this;
        getExtensions(key.toLowerCase(), true, function (matchExts) {
            sortExtensions(matchExts, key, function (matchExts) {
                that.showItemList(dataFormat(matchExts));
            });
        });
    }

    function onEnter(id, elem) {
        openOptionPage(id, elem, function () {
            // cb
        });
    }

    function sortExtFn(a, b) {
        return a.num === b.num ? b.update - a.upate : b.num - a.num;
    }

    function sortExtensions(matchExts, key, callback) {
        chrome.storage.sync.get('ext', function (data) {
            var sExts = data.ext;

            if (!sExts) {
                callback(matchExts);
            }

            // sExts: {id: {id: '', querys: {'key': {num: 0, update: ''}}}}
            matchExts = matchExts.map(function (extObj) {
                var id = extObj.id;

                if (!sExts[id] || !sExts[id].querys[key]) {
                    extObj.num = 0;
                    extObj.upate = 0;

                    return extObj;
                }

                extObj.num = sExts[id].querys[key].num;
                extObj.update = sExts[id].querys[key].update;

                return extObj;
            });

            matchExts.sort(sortExtFn);

            callback(matchExts);
        });
    }

    module.exports = {
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter

    };
});
