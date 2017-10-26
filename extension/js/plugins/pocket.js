/**
 * @file po command plugin script
 * @description pocket文档查找
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import Auth from '../common/auth'
import conf from '../conf/pocket_conf'

const auth = new Auth(conf);
const version = 2;
const name = 'pocket';
const key = 'po';
const type = 'keyword';
const icon = 'http://getpocket.com/i/apple-touch-icon/Pocket_AppIcon_57.png';
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function handler(results) {
    var ret = {};

    ret.request_token = results.split('=')[1];
    return ret;
}

let ajax;

function dataFormat(rawList) {
    return rawList.map(function (item) {
        let title = item.given_title || item.resolved_title || item.excerpt;
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: title,
            desc: subtitle

        };
    });
}

function onInput(key) {
    if (!key && !auth.isAuthenticated()) {
        auth.authenticate(handler);

        return;
    }

    return new Promise(resolve => {
        query(key, function (data) {
            resolve(dataFormat(data));
        });
    });
}

function query(key, callback) {
    if (ajax) {
        ajax.abort();
    }
    let params = {
        consumer_key: auth.consumer_key,
        access_token: auth.get(auth.accessTokenName)
    };

    if (key) {
        $.extend(params, {
            search: key,
            state: 'all'
        });
    }

    ajax = $.post('https://getpocket.com/v3/get', params, function (data) {
        if (data.list) {
            let list = [];
            for (let i in data.list) {
                let item = data.list[i];

                item.id = i;
                list.push(item);
            }
            callback(list);
        }
    });
}

function onEnter({ id }) {
    window.open('http://getpocket.com/a/read/' + id);
}

export default {
    version,
    name: 'Pocket',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
