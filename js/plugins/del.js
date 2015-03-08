/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');

    var name = 'deleteExtension';
    var key = 'del';
    var icon = chrome.extension.getURL('img/del.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function uninstall(id, cb) {
        chrome.management.uninstall(id, function () {
            cb.apply(null, arguments);
        });
    }

    // get all
    function getExtensions(key, enabled, callback) {
        chrome.management.getAll(function (extList) {
            var matchExts = extList.filter(function (ext) {
                return util.matchText(key, ext.name);
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
                desc: item.description,
                isWarn: isWarn

            };
        });
    }
    function onInput(key) {
        var that = this;
        getExtensions(key.toLowerCase(), false, function (matchExts) {
            sortExtensions(matchExts, key, function (matchExts) {
                that.showItemList(dataFormat(matchExts));
            });
        });
    }

    function onEnter(id) {
        uninstall(id, function () {
            // cb
        });
        this.refresh();
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
        key: 'del',
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter

    };
});
