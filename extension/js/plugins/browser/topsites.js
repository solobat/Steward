/**
 * @description list the most visit websites
 * @author tomasy
 * @email solopea@gmail.com
 */

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
    chrome.topSites.get(sites => {
        const arr = [];
        let i;

        for (i in sites) {
            const item = sites[i];
            arr.push({
                key,
                id: item.id,
                icon: icon,
                url: item.url,
                title: item.title,
                desc: item.url,
                isWarn: false
            });
        }
        this.showItemList(arr);
    });
}

function onEnter({ url }) {
    chrome.tabs.create({
        url
    });
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