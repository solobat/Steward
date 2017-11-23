/**
 * @description list the most visit websites
 * @author tomasy
 * @email solopea@gmail.com
 */

const chrome = window.chrome;
const version = 1;
const name = 'workflow';
const key = 'wf';
const type = 'keyword';
const icon = chrome.extension.getURL('img/workflow.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    workflow: true,
    shiftKey: true,
    editable: true
}];

function getWorkflows() {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'getWorkflows'
        }, ({ data = [] }) => {
            resolve(data);
        });
    });
}

const dataFormat = (item, index) => {
    return {
        key: 'workflow',
        id: index,
        icon,
        title: item.title,
        desc: item.desc,
        content: item.content
    }
};

function onInput() {
    return getWorkflows().then(list => {
        return list.map(dataFormat);
    });
}

function onEnter(item) {
    console.log(item);
}

export default {
    version,
    name: 'Workflow',
    icon,
    title,
    commands,
    onInput,
    onEnter
};