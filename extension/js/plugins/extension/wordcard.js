/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import Toast from 'toastr'
import _ from 'underscore'

const extName = '单词小卡片: 查词/收集/背单词';
const version = 3;
const name = 'wordcard';
const key = 'wd';
const type = 'keyword';
const icon = chrome.extension.getURL('img/wordcard.png');
const tagIcon = chrome.extension.getURL('iconfont/exts/wordcard/tag.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    shiftKey: true,
    editable: true
}];

let extID;
const levelIcons = [0, 1, 2, 3, 4, 5].map(level => chrome.extension.getURL(`iconfont/exts/wordcard/level${level}.svg`));

const wordsFormat = (item => {
    return {
        key,
        id: item.id,
        icon: levelIcons[item.level || 0],
        title: item.name,
        desc: `⇧: ${(item.trans || []).join(', ')}`,
        sentence: item.sentence,
        lazyDesc: true
    }
});

const tagsFormat = (tag => {
    return {
        key,
        id: tag,
        icon: tagIcon,
        title: tag,
        desc: 'tag'
    };
});

const levelsFormat = ((level, index) => {
    return {
        key,
        id: level,
        icon: levelIcons[index],
        title: level,
        desc: 'level'
    };
});

function highlightWord(sentence, word) {
    if (sentence && word) {
        const theword = word.toLowerCase();

        return sentence.split(' ').map(item => {
            if (item.toLowerCase().indexOf(theword) !== -1) {
                return `<em>${item}</em>`;
            } else {
                return item;
            }
        }).join(' ');
    } else {
        return sentence;
    }
}

function getTagsAndLevels() {
    const levels = [0, 1, 2, 3, 4, 5].map(levelsFormat);

    return new Promise(resolve => {
        chrome.runtime.sendMessage(extID, {
            action: 'allTags'
        }, ({ data = {} }) => {
            const tags = (data.allTags || []).map(tagsFormat);

            resolve(levels.concat(tags));
        });
    });
}

function getExtLinks() {
    const tabs = [
        { label: '通用', value: 'general' },
        { label: '单词列表', value: 'words' },
        { label: '背单词', value: 'wordsrecite' },
        { label: '词根表', value: 'wordroots' },
        { label: '同步', value: 'advanced' }
    ];

    return tabs.map(tab => {
        const prefixUrl = `chrome-extension://${extID}/options.html?tab=`;
        const url = `${prefixUrl}${tab.value}`;

        return {
            key: 'url',
            icon,
            title: tab.label,
            url: url,
            universal: true
        };
    });
}

function queryByFilter(query) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(extID, {
            action: 'filter',
            query
        }, ({ data = [] }) => {
           resolve(_.sortBy(data, 'level').map(wordsFormat));
        });
    });
}

function queryFromExt(query) {
    if (query) {
        return queryByFilter(query);
    } else {
        return getTagsAndLevels().then(items => {
            const links = getExtLinks();

            return links.concat(items);
        });
    }
}

function reviewWord(id, gotit, word) {
    chrome.runtime.sendMessage(extID, {
        action: 'review',
        data: { id, gotit, word }
    }, resp => {
        console.log(resp);
    });
}

function onInput(query) {
    return queryFromExt(query.trim());
}

function onEnter(item, command, query, { shiftKey }) {
    const str = query.trim();

    if (str) {
        Toast.clear();

        if (shiftKey) {
            reviewWord(item.id, true, item.title);
            Toast.success(item.title);
        } else {
            reviewWord(item.id, false, item.title);
            Toast.info(highlightWord(item.sentence, item.title), item.title, { timeOut: 12000 });
        }

        return Promise.resolve(true);
    } else {
        return Promise.resolve(`${command.key} ${item.id}`);
    }
}

function setup(ext) {
    extID = ext.id;
    if (window.stewardCache) {
        window.stewardCache.wordcardExtId = extID;
    }
}

export default {
    version,
    extName,
    name: 'wordcard',
    category: 'extension',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    setup
};
