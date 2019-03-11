import util from '../common/util'
import browser from 'webextension-polyfill'

const icon = chrome.extension.getURL('img/icon.png');

function format(list) {
    return list.map(item => {
        return {
            key: 'url',
            url: item.value,
            title: `${item.label}: ${item.value}`,
            desc: item.lable,
            icon,
            weight: 100
        };
    });
}

function parseLine(line) {
    const realLine = line.trim();
    const parts = realLine.split(/[\s]+/).slice(0, 2);

    return {
        label: parts[0],
        value: parts[1]
    };
}

const STORAGE_KEY = 'text_alias';

const TextAlias = {
    items: null,

    resolveItems(text) {
        return text.split('\n')
            .filter(line => line && !line.match(/^[\s\t]+$/))
            .map(parseLine)
            .filter(line => Boolean(line.label));
    },

    getItems() {
        if (this.items) {
            return Promise.resolve(this.items);
        } else {
            return browser.storage.sync.get(STORAGE_KEY).then(resp => {
                const text = resp[STORAGE_KEY];

                if (text) {
                    const items = this.resolveItems(text);

                    this.items = items;

                    return items;
                } else {
                    return [];
                }
            });
        }
    },

    onInput(query) {
        return this.getItems().then(items => {
            if (items && items.length) {
                return format(util.getMatches(items, query, 'label') || [])
            } else {
                return [];
            }
        });
    }
};

export default TextAlias

export function getTextAlias() {
    return browser.storage.sync.get(STORAGE_KEY).then(resp => {
        return resp[STORAGE_KEY] || '';
    });
}

export function saveTextAlias(text) {
    return browser.storage.sync.set({
        [STORAGE_KEY]: text
    });
}