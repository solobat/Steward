/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import Toast from 'toastr'

const extName = '单词小卡片: 查词/收集/背单词';
const version = 1;
const name = 'wordcard';
const key = 'wd';
const type = 'keyword';
const icon = chrome.extension.getURL('img/wordcard.png');
const levelIcon = chrome.extension.getURL('img/exts/wordcard/level.png');
const tagIcon = chrome.extension.getURL('img/exts/wordcard/tag.png');
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

let extID;

const wordsFormat = (item => {
    return {
        key,
        id: item.id,
        icon,
        title: item.name,
        desc: (item.trans || []).join(', '),
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

const levelsFormat = (level => {
    return {
        key,
        id: level,
        icon: levelIcon,
        title: level,
        desc: 'level'
    };
});

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

function queryByFilter(query) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage(extID, {
            action: 'filter',
            query
        }, ({ data = [] }) => {
           resolve(data.map(wordsFormat));
        });
    });
}

function queryFromExt(query) {
    if (query) {
        return queryByFilter(query);
    } else {
        return getTagsAndLevels();
    }
}

function onInput(query) {
    return queryFromExt(query.trim());
}

function onEnter(item, command, query) {
    const str = query.trim();

    if (str) {
        Toast.success(item.sentence);

        return true;
    } else {
        return `${command.key} ${item.id}`;
    }
}

function setup(ext) {
    extID = ext.id;
}

export default {
    version,
    extName,
    name: 'wordcard',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    setup
};
