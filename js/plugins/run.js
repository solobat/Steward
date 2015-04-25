/**
 * @file run command plugin script
 * @description 启动指定应用
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util');

    var name = 'runapp';
    var key = 'run';
    var icon = chrome.extension.getURL('img/app.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function getExtensions(key, callback) {
        chrome.management.getAll(function (extList) {
            var data = extList.filter(function (ext) {
                return util.matchText(key, ext.name) && ext.isApp;
            });

            callback(data);
        });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            var url = item.icons instanceof Array ? item.icons[0].url : '';
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
        getExtensions(key.toLowerCase(), function (data) {
            that.showItemList(dataFormat(data));
        });
    }

    function launch(id) {
        chrome.management.setEnabled(id, true, function () {
            chrome.management.launchApp(id, function () {});
        });
    }

    function onEnter(id) {
        launch(id);
        this.refresh();
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
