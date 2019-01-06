/**
 * @description url block
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import browser from 'webextension-polyfill'
import constant from '../../constant'

const version = 5;
const name = 'urlblock';
const keys = [{ key: 'bk', allowBatch: true }, { key: 'bk8', allowBatch: true }, { key: 'bkseturl' }];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/urlblock.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const BLOCK_EXPIRED = 8 * 60 * 60 * 1000;
const commands = util.genCommands(name, icon, keys, type);

function onSeturlInput(key, command) {
    if (key) {
        return util.getDefaultResult(command);
    } else {
        return getSitesList().then(list => {
            if (list.length) {
                return list.map((url, index) => {
                    return {
                        key: 'bkseturl',
                        title: `URL ${index + 1}`,
                        desc: url,
                        icon,
                        url
                    };
                });
            } else {
                return util.getDefaultResult(command);
            }
        });
    }
}

function onInput(key, command, inContent) {
    if (command.orkey === 'bkseturl') {
        return onSeturlInput(key, command);
    } else {
        if (!key) {
            return Reflect.apply(showBlacklist, this, [command]);
        } else {
            if (key === '/' && inContent) {
                window.stewardApp.applyCommand(`${command.key} ${window.parentHost}`);
            } else {
                return util.getDefaultResult(command);
            }
        }
    }
}

const storageKey = constant.STORAGE.URLBLOCK_REPLACE_PAGE;

function getSitesList() {
    return browser.storage.sync.get(storageKey).then(resp => {
        const arr = resp[storageKey] || [];

        if (arr instanceof Array) {
            return arr;
        } else {
            return [arr];
        }
    });
}

function addBlockedSiteReplaceURL(query) {
    return getSitesList().then(list => {
        if (list.indexOf(query) === -1) {
            list.push(query);

            return browser.storage.sync.set({
                [storageKey]: list
            });
        } else {
            return Promise.reject();
        }
    }).then(() => {
        util.toast.success(chrome.i18n.getMessage('set_ok'));

        window.stewardApp.applyCommand('bkseturl ');
    });
}

function removeBlockedSiteReplaceURL(item) {
    return getSitesList().then(list => {
        const arr = list.filter(url => url !== item.url);

        return browser.storage.sync.set({
            [storageKey]: arr
        });
    }).then(() => {
        window.stewardApp.applyCommand('bkseturl ');
    });
}

function onEnter(item, command, query) {
    if (command.orkey === 'bkseturl') {
        if (query) {
            return addBlockedSiteReplaceURL(query);
        } else {
            return removeBlockedSiteReplaceURL(item);
        }
    } else {
        if (this.query) {
            return Reflect.apply(addBlacklist, this, [command.key, this.query, command.orkey]);
        } else {
            return Reflect.apply(removeBlacklist, this, [item]);
        }
    }
}

function removeBlacklist(data) {
    let list;

    if (data instanceof Array) {
        list = data;
    } else {
        list = [data];
    }

    const validList = list.filter(item => {
        if (!String(item.id).startsWith('bk_') && (Number(new Date()) - item.id) < BLOCK_EXPIRED) {
            window.slogs.push(`${item.title} will be blocked 8 hours...`);
            return false
        } else {
            return true;
        }
    });

    return new Promise(resolve => {
        getBlacklist(resp => {
            const ids = validList.map(item => item.id);
            const blacklist = resp.filter(function (url) {
                if (ids.indexOf(url.id) === -1) {
                    return true;
                } else {
                    window.slogs.push(`unblock: ${url.title}`);
                    return false;
                }
            });

            chrome.storage.sync.set({
                url: blacklist
            }, () => {
                    resolve('');
                    noticeBackground('unblockUrl', validList.map(item => item.title));
                });
        });
    });
}

function addBlacklist(key, url, cmd) {
    return new Promise(resolve => {
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
                resolve(`${key} `);
                window.slogs.push(`block: ${url}`);
                noticeBackground('blockUrl', url);
            });
        });
    });
}

function noticeBackground(action, url) {
    chrome.runtime.sendMessage({
        action: action,
        data: {
            url
        }
    });
}

function getBlacklist(callback) {
    chrome.storage.sync.get('url', function (results) {
        const blacklist = results.url;

        callback(blacklist);
    });
}

function dataFormat(rawList, cmd) {
    const desc = chrome.i18n.getMessage(`urlblock_un${cmd}_subtitle`);

    return rawList.map(function (item) {
        return {
            key: name,
            id: item.id,
            icon: icon,
            title: item.title,
            desc
        };
    });
}

function showBlacklist(command) {
    const cmd = command.orkey;

    return new Promise(resolve => {
        getBlacklist(function (blacklist) {
            let data = [];
            if (blacklist) {
                data = blacklist.filter(item => {
                    return cmd === (item.type || 'bk8');
                }) || [];
            }

            if (data && data.length) {
                resolve(dataFormat(data, cmd));
            } else {
                resolve(util.getDefaultResult(command));
            }
        });
    });
}

export default {
    version,
    name: 'URL Block',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
