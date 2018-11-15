/**
 * @description run or edit workflow
 * @author tomasy
 * @email solopea@gmail.com
 */
import util from '../../common/util'
import _ from 'underscore'

const chrome = window.chrome;
const version = 3;
const name = 'workflow';
const keys = [
    { key: 'wf', workflow: true },
    { key: 'wfe', shiftKey: true }
];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/workflow.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
let curWid;

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

function getWorkflow(wid) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'getWorkflow',
            data: wid
        }, ({ data = {} }) => {
            resolve(data);
        });
    });
}

const dataFormat = (list, command) => {
    return list.map((item, index) => {
        const { orkey } = command;
        const ret = {
            id: index,
            wid: item.id,
            icon,
            times: item.times || 0,
            title: item.title,
            content: item.content
        };

        if (orkey === 'wf') {
            Object.assign(ret, {
                key: 'workflow',
                desc: item.desc
            });
        } else if (orkey === 'wfe') {
            Object.assign(ret, {
                key: 'plugin',
                desc: command.subtitle
            });
        }

        return ret;
    });
};

function queryWorkflows(query, command) {
    return getWorkflows(query).then((list = []) => {
        if (list.length) {
            return _.sortBy(dataFormat(list, command), 'times').reverse();
        } else {
            return util.getDefaultResult(command);
        }
    });
}

function onInput(query, command) {
    const { orkey } = command;

    if (orkey === 'wf') {
        return queryWorkflows(query, command);
    } else if (orkey === 'wfe') {
        if (!curWid) {
            return queryWorkflows('', command);
        } else {
            getWorkflow(curWid).then(model => {
                listWorkflowLines(model.id, model.content);
            });
        }
    }
}

function handleWfEnter(item) {
    return updateWorkflow({
        id: item.wid,
        times: item.times + 1
    });
}

function parseContent(content) {
    return content.split('\n')
        .filter(line => line && !line.match(/^[\s\t]+$/))
}

function listWorkflowLines(wid, content) {
    const lines = parseContent(content);

    const backToWorkflow = [{
        key: 'plugin',
        icon,
        action: 'backto',
        title: '../'
    }];
    const list = backToWorkflow.concat(lines.map(line => {
        return {
            key: 'plugin',
            icon,
            wid,
            title: line
        };
    }));

    curWid = wid;
    window.stewardApp.updateList(list);
}

function handleWorkflowEditEnter(item) {
    listWorkflowLines(item.wid, item.content);

    return Promise.resolve('');
}

function updateWorkflow(attrs) {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: 'updateWorkflow',
            data: attrs
        }, resp => {
            resolve(resp.data);
        });
    });
}

function addLineToWorkflow(query, item, list) {
    const lines = list.filter(line => !line.action).map(line => line.title);

    lines.push(query);

    return updateWorkflow({
        id: curWid,
        content: lines.join('\n')
    });
}

function offsetWorkflowLine(item, list) {
    const realList = list.filter(line => !line.action);
    const index = realList.indexOf(item);

    if (index > 0) {
        realList.splice(index, 1);
        realList.splice(index - 1, 0, item);

        const lines = realList.map(line => line.title);

        return updateWorkflow({
            id: curWid,
            content: lines.join('\n')
        });
    }
}

function deleteWorkflowLine(item, list) {
    const lines = list.filter(line => !line.action && line.title !== item.title).map(line => line.title);

    return updateWorkflow({
        id: curWid,
        content: lines.join('\n')
    });
}

function handleWorkflowLineEditEnter(item, command, query, shiftKey, list) {
    if (!query && item.action === 'backto') {
        curWid = '';

        return Promise.resolve(`${command.key} `);
    } else {
        let result;

        if (query) {
            result = addLineToWorkflow(query, item, list);
        } else {
            if (shiftKey) {
                result = offsetWorkflowLine(item, list);
            } else {
                result = deleteWorkflowLine(item, list);
            }
        }

        return result.then(() => {
            return `${command.key} `;
        });
    }
}

function handleWfeEnter(item, command, query, shiftKey, list) {
    if (!curWid) {
        return handleWorkflowEditEnter(item, command);
    } else {
        return handleWorkflowLineEditEnter(item, command, query, shiftKey, list);
    }
}

function onEnter(item, command, query, { shiftKey }, list) {
    const { orkey } = command;

    if (orkey === 'wf') {
        return handleWfEnter(item);
    } else if (orkey === 'wfe') {
        return handleWfeEnter(item, command, query, shiftKey, list);
    }
}

export default {
    version,
    name: 'Workflow',
    category: 'steward',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};