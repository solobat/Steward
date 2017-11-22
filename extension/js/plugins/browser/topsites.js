/**
 * @description list the most visit websites
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'

const chrome = window.chrome;
const version = 2;
const name = 'topsites';
const key = 'site';
const type = 'keyword';
const icon = chrome.extension.getURL('img/topsites.png');
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

function onInput() {
    return new Promise(resolve => {
        chrome.topSites.get(sites => {
            const arr = [];
            const wrapDesc = util.wrapWithMaxNumIfNeeded('url');
            let i;

            for (i in sites) {
                const item = sites[i];
                const desc = wrapDesc(item, i);
                arr.push({
                    key,
                    id: item.id,
                    icon: icon,
                    url: item.url,
                    title: item.title,
                    desc,
                    isWarn: false
                });
            }

            resolve(arr);
        });
    });
}

function onEnter({ url }, command, query, shiftKey, list) {
    if (shiftKey) {
        const maxOperandsNum = window.stewardCache.config.general.maxOperandsNum;

        list.slice(0, maxOperandsNum).forEach(topsite => {
            chrome.tabs.create({
                url: topsite.url,
                active: false
            });
        });
    } else {
        chrome.tabs.create({
            url
        });
    }
}

export default {
    version,
    name: 'Top Sites',
    icon,
    title,
    commands,
    onInput,
    onEnter
};