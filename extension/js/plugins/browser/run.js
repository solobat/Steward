/**
 * @description run app
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const version = 2;
const name = 'runapp';
const key = 'run';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/app.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function getExtensions(query, callback) {
    chrome.management.getAll(function (extList) {
        const data = extList.filter(function (ext) {
            return util.matchText(query, ext.name) && ext.isApp;
        });

        callback(data);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        const url = item.icons instanceof Array ? item.icons[0].url : '';
        const isWarn = item.installType === 'development';

        return {
            key,
            id: item.id,
            icon: url,
            title: item.name,
            desc: item.description,
            isWarn
        };
    });
}

function onInput(query) {
    return new Promise(resolve => {
        getExtensions(query.toLowerCase(), function (data) {
            resolve(dataFormat(data));
        });
    });
}

function launch(id) {
    chrome.management.setEnabled(id, true, function () {
        chrome.management.launchApp(id, function () {});
    });
}

function onEnter({ id }) {
    launch(id);
    this.refresh();
}

export default {
    version,
    name: 'Run App',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
