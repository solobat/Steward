/**
 * @file help command plugin script
 * @description 帮助
 * @author rong
 */

define(function (require, exports, module) {
    var name = 'help';
    var key = 'help';
    var icon = chrome.extension.getURL('img/help.ico');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');
    var helpList = [
        {
            icon: 'img/help.ico',
            title: 'on:启用扩展',
            desc: 'on:Start extend'
        },
        {
            icon: 'img/help.ico',
            title: 'off:禁用扩展',
            desc: 'off:Close extend'
        },
        {
            icon: 'img/help.ico',
            title: 'set:设置扩展',
            desc: 'set:Set extend'
        },
        {
            icon: 'img/help.ico',
            title: 'bm:查找并打开书签',
            desc: 'bm:Search and open bookmark'
        },
        {
            icon: 'img/help.ico',
            title: 'his:查找历史纪录并打开标签页',
            desc: 'his:Search history and open it'
        },
        {
            icon: 'img/help.ico',
            title: 'yd:有道词典',
            desc: 'yd:Youdao dictionary'
        },
        {
            icon: 'img/help.ico',
            title: 'del:删除扩展',
            desc: 'del:Delete extend'
        },
        {
            icon: 'img/help.ico',
            title: 'run:启动APP',
            desc: 'run:Start APP'

        },
        {
            icon: 'img/help.ico',
            title: 'tab:查找并定位到打开的标签页',
            desc: 'tab:Search one opened page and open it'
        },
        {
            icon: 'img/help.ico',
            title: 'todo:待办事项添加',
            desc: 'todo: add todo'

        },
        {
            icon: 'img/help.ico',
            title: 'bk:屏蔽指定网址',
            desc: 'bk:Forbid one website'
        },
        {
            icon: 'img/help.ico',
            title: 'po:查找pocket文章',
            desc: 'po:Search pocket article'
        }
    ]

    function onInput(key) {
        var that = this;
            that.showItemList(helpList);
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
