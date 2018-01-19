/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */
import $ from 'jquery'
import STORAGE from '../../js/constant/storage'
import { getSyncConfig } from '../../js/common/config'
import { WorkflowList } from '../../js/collection/workflow'

const Workflows = new WorkflowList();
let config = {};
let todos = [];
let blockedUrls = [];

const workflowHelper = {
    create: function(info) {
        if (info.title && info.content) {
            const workflow = Workflows.create({
                ...info
            });

            return workflow;
        } else {
            return 'no title or content';
        }
    },

    remove: function(id) {
        const model = Workflows.remove(id);
        Workflows.chromeStorage.destroy(model);

        return model;
    },

    update: function(attrs) {
        const workflow = Workflows.set(attrs, {
            add: false,
            remove: false
        });

        workflow.save();

        return workflow;
    },

    refresh() {
        return Workflows.fetch();
    },

    getWorkflow(id) {
        return Workflows.findWhere({
            id
        });
    },

    getWorkflows: function() {
        return Workflows.toJSON();
    },

    init: function() {
        return workflowHelper.refresh();
    }
};

function addEvents() {
    chrome.runtime.onMessage.addListener((req, sender, resp) => {
        switch (req.action) {
            case 'saveConfig':
                saveConfig(req.data, resp);
                break;
            case 'getData':
                resp({
                    msg: 'get data',
                    data: {
                        config,
                        todos,
                        blockedUrls
                    }
                });
                break;
            case 'getConfig':
                resp({
                    msg: 'get config ok',
                    data: config
                });
                break;
            case 'getTodos':
                resp({
                    msg: 'get todos ok',
                    data: todos
                });
                break;
            case 'getblockedUrls':
                resp({
                    msg: 'get urls ok',
                    data: blockedUrls
                });
                break;
            case 'getWorkflow':
                resp({ msg: 'getWorkflow', data: workflowHelper.getWorkflow(req.data) });
                break;
            case 'getWorkflows':
                resp({ msg: 'getWorkflows', data: workflowHelper.getWorkflows() });
                break;
            case 'createWorkflow':
                resp({ msg: 'createWorkflow', data: workflowHelper.create(req.data) });
                break;
            case 'updateWorkflow':
                resp({ msg: 'updateWorkflow', data: workflowHelper.update(req.data) });
                break;
            case 'removeWorkflow':
                resp({ msg: 'removeWorkflow', data: workflowHelper.remove(req.data) });
                break;
            default:
                break;
        }
    });

    chrome.storage.onChanged.addListener(changes => {
        if (changes.config) {
            config = changes.config.newValue;
            console.log('config has changed...', config);
        }
        if (changes.todo) {
            todos = changes.todo.newValue;
            console.log('todo has changed...', todos);
        }
        if (changes.url) {
            blockedUrls = changes.url.newValue;
            console.log('url has changed...', blockedUrls);
        }
        if (changes.workflows) {
            workflowHelper.refresh();
        }
    });

    chrome.commands.onCommand.addListener(function(command) {
        if (command === 'open-in-content-page') {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "openBox"}, function() {});
            });
        }
    });
}

function saveConfig(newConfig = {}, resp) {
    $.extend(true, config, newConfig);

    chrome.storage.sync.set({
        config
    }, function() {
        resp({
           action: 'configSaved',
           data: config
        });
    });
}

function getTodos() {
    return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE.TODO, resp => {
            resolve(resp.todo || []);
        })
    });
}

function getblockedUrls() {
    return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE.URL, resp => {
            resolve(resp.url || []);
        });
    });
}

function init() {
    Promise.all([
        getSyncConfig(true, true),
        getTodos(),
        getblockedUrls(),
        workflowHelper.init()
    ]).then(resp => {
        config = resp[0];
        todos = resp[1];
        blockedUrls = resp[2];
        addEvents();
    }).catch(resp => {
        console.log(resp);
        addEvents();
    });
}

init();
