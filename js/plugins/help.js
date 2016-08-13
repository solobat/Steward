/**
 * @file help command plugin script
 * @description 帮助
 * @author rong
 */

define(function (require, exports, module) {
    var _ = require('../lib/underscore')
    var name = 'help'
    var key = 'help'
    var icon = chrome.extension.getURL('img/help.ico');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    // NOTE: 只在需要的时候获取plugins, main.js里已经立即获取过, 这里再获取会为空对象
    function getPlugins() {
        var plugins = require('./plugins')
        var helpList = _.uniq(_.values(plugins)).map((plugin) => {
            return {
                icon: plugin.icon,
                title: plugin.title,
                desc: plugin.subtitle
            }
        })

        return helpList;
    }

    function onInput(key) {

        var that = this;

        that.showItemList(getPlugins());
    }

    function onEnter() {
    }

    module.exports = {
        key: 'help',
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter
    };
});
