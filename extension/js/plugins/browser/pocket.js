/**
 * @description find in your pocket
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import Auth from '../../common/auth'
import conf from '../../conf/pocket_conf'
import util from '../../common/util'

const auth = new Auth(conf);
const version = 3;
const name = 'pocket';
const key = 'po';
const type = 'keyword';
const icon = 'https://getpocket.com/i/apple-touch-icon/Pocket_AppIcon_57.png';
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    allowBatch: true,
    editable: true
}];

function handler(results) {
    const ret = {};

    ret.request_token = results.split('=')[1];
    return ret;
}

let ajax;

function dataFormat(rawList) {
    return rawList.map(function (item) {
        const itemTitle = item.given_title || item.resolved_title || item.excerpt;

        return {
            key: key,
            id: item.id,
            icon: icon,
            title: itemTitle,
            desc: subtitle
        };
    });
}

function onInput(queryString) {
    if (!queryString && !auth.isAuthenticated()) {
        auth.authenticate(handler);

        return;
    }

    return new Promise(resolve => {
        query(queryString, function (data) {
            resolve(dataFormat(data));
        });
    });
}

function query(str, callback) {
    if (ajax) {
        ajax.abort();
    }
    const params = {
        consumer_key: auth.consumer_key,
        access_token: auth.get(auth.accessTokenName)
    };

    if (str) {
        $.extend(params, {
            search: str,
            state: 'all'
        });
    }

    ajax = $.post('https://getpocket.com/v3/get', params, function (data) {
        if (data.list) {
            const list = [];
            let i;

            for (i in data.list) {
                const item = data.list[i];

                item.id = i;
                list.push(item);
            }
            callback(list);
        }
    });
}

function onEnter(item, command, q, shiftKey, list) {
    util.batchExecutionIfNeeded(false, [
        it => {
            chrome.tabs.create({ url: `https://getpocket.com/a/read/${it.id}`, active: false });
            window.slogs.push(`open pocket ${it.title}`);
        },
        it => {
            chrome.tabs.create({ url: `https://getpocket.com/a/read/${it.id}` });
            window.slogs.push(`open pocket ${it.title}`);
        }
    ], [list, item]);
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
