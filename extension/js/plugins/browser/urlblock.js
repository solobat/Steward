/**
 * @description url block
 * @author tomasy
 * @email solopea@gmail.com
 */

import request from '../../common/request'
import util from '../../common/util'

const version = 4;
const name = 'urlblock';
const keys = [{ key: 'bk' }, { key: 'bk8' }];
const type = 'keyword';
const icon = chrome.extension.getURL('img/urlblock.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const BLOCK_EXPIRED = 8 * 60 * 60 * 1000;
const commands = util.genCommands(name, icon, keys, type);

function onInput(key, command, inContent) {
    if (!key) {
        return Reflect.apply(showBlacklist, this, [command.orkey]);
    } else {
        if (key === '/' && inContent) {
            this.render(`${command.key} ${window.parentHost}`);
        }
    }
}

function onEnter(item, command) {
    if (this.query) {
        Reflect.apply(addBlacklist, this, [command.key, this.query, command.orkey]);
    } else {
        Reflect.apply(removeBlacklist, this, [item.id]);
    }
}

function removeBlacklist(id) {
    if (!String(id).startsWith('bk_') && (Number(new Date()) - id) < BLOCK_EXPIRED) {
        console.log('url will be blocked 8 hours...');
        return;
    }

    getBlacklist(resp => {
        const blacklist = resp.filter(function (url) {
            return url.id !== id;
        });

        chrome.storage.sync.set({
            url: blacklist
        }, () => {
                this.refresh();
            });
    });
}

function addBlacklist(key, url, cmd) {
    getBlacklist(data => {
        let blacklist = data;
        if (!blacklist || !blacklist.length) {
            blacklist = [];
        }
        let id;
        const datetime = Number(new Date());

        if (cmd === 'bk8') {
            id = datetime;
        } else {
            id = `bk_${datetime}`;
        }

        blacklist.push({
            id,
            type: cmd,
            title: url
        });

        chrome.storage.sync.set({
            url: blacklist
        }, () => {
            this.render(`${key} `);
            noticeBackground('blockUrl', url);
        });
    });
}

function noticeBackground(action, url) {
    request.send({
        action: action,
        data: {
            url: url
        }
    });
}

function getBlacklist(callback) {
    chrome.storage.sync.get('url', function (results) {
        const blacklist = results.url;

        callback(blacklist);
    });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: name,
            id: item.id,
            icon: icon,
            title: item.title,
            desc: subtitle
        };
    });
}

function showBlacklist(cmd) {
    return new Promise(resolve => {
        getBlacklist(function (blacklist) {
            let data = [];
            if (blacklist) {
                data = blacklist.filter(item => {
                    return cmd === (item.type || 'bk8');
                }) || [];
            }
            resolve(dataFormat(data));
        });
    });
}

export default {
    version,
    name: 'URL Block',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
