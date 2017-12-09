/**
 * @description list the most visit websites
 * @author tomasy
 * @email solopea@gmail.com
 */
import util from '../../common/util'
import _ from 'underscore'

const chrome = window.chrome;
const version = 2;
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
    editable: true
}];

function getWorkflows(query) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'getWorkflows'
        }, ({ data = [] }) => {
            resolve(data.filter(workflow => {
                return util.matchText(query, workflow.title);
            }));
        });
    });
}

const dataFormat = (item, index) => {
    return {
        key: 'workflow',
        id: index,
        wid: item.id,
        icon,
        times: item.times || 0,
        title: item.title,
        desc: item.desc,
        content: item.content
    }
};

function onInput(query, command) {
    return getWorkflows(query).then((list = []) => {
        if (list.length) {
            return _.sortBy(list.map(dataFormat), 'times').reverse();
        } else {
            return util.getDefaultResult(command);
        }
    });
}

function onEnter(item) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'updateWorkflow',
            data: {
                id: item.wid,
                times: item.times + 1
            }
        }, () => {
            resolve('');
        });
    });
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