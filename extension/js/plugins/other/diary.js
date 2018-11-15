/**
 * @description add notes
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import moment from 'moment'
import diaryHelper from '../../helper/diaryHelper'

const version = 1;
const name = 'diary';
const keys = [
    { key: 'diary' },
    { key: ':', keyname: 'say', shiftKey: true }
];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/diary.svg')
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
const messages = [];
let isFirst = true;

const diaryInit = diaryHelper.init();

window.diaryHelper = diaryHelper;

function handleSayInput(command) {
    if (messages.length) {
        return dataFormat(messages);
    } else {
        return util.getDefaultResult(command);
    }
}

function handleDiaryInput(command) {
    return diaryInit.then(() => {
        const list = diaryHelper.getDiaryList();

        if (list && list.length) {
            return list.reverse().map(diary => {
                return {
                    icon: command.icon,
                    title: `diary: ${diary.date}`,
                    date: diary.date,
                    id: diary.id,
                    desc: command.subtitle
                };
            });
        } else {
            return util.getDefaultResult(command);
        }
    });
}

function onInput(key, command) {
    const { orkey } = command;

    if (orkey === ':') {
        return handleSayInput(command);
    } else if (orkey === 'diary') {
        return handleDiaryInput(command);
    }
}

function dataFormat(list = []) {
    return list.map(message => {
        return {
            key: 'plugin',
            icon,
            id: message.id,
            title: message.text,
            desc: moment(message.time).format('YYYY/MM/DD HH:mm:SS'),
            raw: message
        }
    }).reverse();
}

function createMessage(text = '') {
    if (text.trim()) {
        return {
            id: util.guid(),
            time: Number(new Date()),
            text: text.trim()
        };
    } else {
        return null;
    }
}

function handleNewMsgEnter(query) {
    const newMsg = createMessage(query);

    if (newMsg) {
        return updateMessages(newMsg);
    } else {
        Toast.warning(chrome.i18n.getMessage('diary_warning_notempty'));

        return Promise.reject('');
    }
}

function updateMessages(message) {
    const index = messages.findIndex(item => item.id === message.id);

    if (index === -1) {
        messages.push(message);
    } else {
        messages.splice(index, 1);
    }

    return saveMessages(messages).then(resp => {
        isFirst = false;

        return Promise.resolve(resp);
    });
}

function getDate() {
    return moment().format('YYYY/MM/DD');
}

function saveMessages(data) {
    return diaryHelper.refresh().then(() => {
        return diaryHelper.updateMessages(data, getDate(), isFirst);
    });
}

function handleSayEnter(query, item, command, shiftKey, box) {
    let task;

    if (!shiftKey) {
        task = handleNewMsgEnter(query);
    } else {
        task = updateMessages(item.raw);
    }

    return task.then(() => {
        window.stewardApp.updateList(dataFormat(messages, command));
        window.stewardApp.clearQuery();

        return true;
    }).catch(resp => {
        console.log(resp);

        return Promise.resolve(true);
    });
}

function handleDiaryEnter(item, shiftKey) {
    diaryHelper.download(item.date);

    if (shiftKey) {
        diaryHelper.remove(item.id);

        return Promise.resolve('');
    } else {
        return;
    }
}

function onEnter(item, command, query, { shiftKey }) {
    const { orkey } = command;

    if (orkey === ':') {
        return handleSayEnter(query, item, command, shiftKey, this);
    } else if (orkey === 'diary') {
        return handleDiaryEnter(item, shiftKey);
    }
}


export default {
    version,
    name: 'Diary',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true
}
