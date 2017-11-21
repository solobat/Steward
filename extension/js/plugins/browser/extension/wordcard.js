/**
 * @description list tabs and open
 * @author tomasy
 * @email solopea@gmail.com
 */

import Toast from 'toastr'
import _ from 'underscore'

const extName = '单词小卡片: 查词/收集/背单词';
const version = 1;
const name = 'wordcard';
const key = 'wd';
const type = 'keyword';
const icon = chrome.extension.getURL('img/wordcard.png');
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
const levelIcons = [0, 1, 2, 3, 4, 5].map(level => chrome.extension.getURL(`img/exts/wordcard/level${level}.png`));

const wordsFormat = (item => {
    return {
        key,
        id: item.id,
        icon: levelIcons[item.level || 0],
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

const levelsFormat = ((level, index) => {
    return {
        key,
        id: level,
        icon: levelIcons[index],
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
           resolve(_.sortBy(data, 'level').map(wordsFormat));
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

function reviewWord(id, gogit) {
    chrome.runtime.sendMessage(extID, {
        action: 'review',
        data: { id, gogit }
    }, resp => {
        console.log(resp);
    });
}

function onInput(query) {
    return queryFromExt(query.trim());
}

function onEnter(item, command, query) {
    const str = query.trim();

    if (str) {
        Toast.info(item.sentence, item.title, { timeOut: 120000 });
        reviewWord(item.id, false);
        return Promise.resolve(true);
    } else {
        return Promise.resolve(`${command.key} ${item.id}`);
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
