/**
 * @file bm command plugin script
 * @description 书签记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'

var chrome = window.chrome;
var version = 1;
var name = 'topsites';
var key = 'site';
var icon = chrome.extension.getURL('img/topsites.png');
var title = chrome.i18n.getMessage(name + '_title');
var subtitle = chrome.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput(key) {
    var that = this;
    chrome.topSites.get(function (sites) {
        var arr = [];
        for (var i in sites) {
            var item = sites[i];
            arr.push({
                key: key,
                id: item.id,
                icon: icon,
                url: item.url,
                title: item.title,
                desc: item.url,
                isWarn: false
            });
        }
        that.showItemList(arr);
    });
}

function onEnter(id, elem) {
    chrome.tabs.create({
        url: $(elem).data('url')
    });
}

export default {
    version,
    name: 'Top Sites',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};