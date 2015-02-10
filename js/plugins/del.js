/**
 * @file del command script
 * @description delete extensions / apps by del command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');
    var title = '删除扩展';
    var subtitle = '查找并删除扩展';

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

    function onInput(key) {
        var that = this;
        getExtensions(key.toLowerCase(), false, function (matchExts) {
            sortExtensions(matchExts, key, function (matchExts) {
                that.showItemList(matchExts);
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
        return a.num == b.num ? b.update - a.upate : b.num - a.num;
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

    function createItem(index, item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';

        return [
            '<div data-type="ext" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + url + '" alt="" />',
            '<span class="ec-item-name ' + (item.installType === 'development' ? 'ec-item-warn' : '') + '">' + item.name + '</span>',
            '</div>'
        ];
    }

    module.exports = {
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem

    };
});
