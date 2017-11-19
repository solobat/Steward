/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */
import $ from 'jquery'
import _ from 'underscore'
import STORAGE from '../../js/constant/storage'
import { getSyncConfig } from '../../js/common/config'

let config = {};

// handle todos
function getTodos() {
    return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE.TODO, function (results) {
            resolve(results.todo);
        });
    });
}

function getTabsByWindows(win) {
    return new Promise(resolve => {
        chrome.tabs.getAllInWindow(win.id, function (tabs) {
            resolve(tabs);
        });
    });
}

function getAllTabs() {
    return new Promise(resolve => {
        chrome.windows.getAll(function (wins) {
            if (!wins.length) {
                return;
            }
            const tasks = [];

            for (let i = 0, len = wins.length; i < len; i = i + 1) {
                tasks.push(getTabsByWindows(wins[i]));
            }

            Promise.all(tasks).then(resp => {
                resolve(_.flatten(resp).filter(tab => {
                    return tab.url.indexOf('http' !== -1);
                }));
            });
        });
    });
}

const tabsInfo = {};

function refreshTodo() {
    Promise.all([
        getTodos(),
        getAllTabs()
    ]).then(([todos = [], tabs = []]) => {
        for (let i = 0, len = tabs.length; i < len; i = i + 1) {
            const tab = tabs[i];
            const todo = todos[i];

            if (todo) {
                if (!tabsInfo[tab.id]) {
                    tabsInfo[tab.id] = {
                        originalTitle: tab.title
                    };
                }
                chrome.tabs.executeScript(tab.id, {
                    code: `document.title = "${todo.title}"`
                });
            } else {
                if (tabsInfo[tab.id]) {
                    chrome.tabs.executeScript(tab.id, {
                        code: `document.title = "${tabsInfo[tab.id].originalTitle}"`
                    });
                    Reflect.deleteProperty(tabsInfo, tab.id);
                }
            }
        }
    });
}

// handle url block
const blockPageUrl = chrome.extension.getURL('urlblock.html');
function getBlacklist(callback) {
    chrome.storage.sync.get(STORAGE.URL, function (results) {
        const blacklist = results.url;

        callback(blacklist);
    });
}

function blockUrl (url) {
    if (!url) {
        return;
    }

    getAllTabs().then((tabs = []) => {
        for (let i = 0; i < tabs.length; i = i + 1) {
            if (tabs[i].url.indexOf(url) !== -1) {
                blockTab(tabs[i]);
            }
        }
    });
}

function blockTab(tab) {
    chrome.tabs.executeScript(tab.id, {
        code: `
            window.history.pushState({}, "${tab.title}", "${tab.url}");
            window.location.href = "${blockPageUrl}?original=${tab.url}"
        `
    });
}
function checkTabByUrl(tab) {
    if (!tab.url) {
        return;
    }
    getBlacklist(function (blacklist) {
        for (let i = 0; i < blacklist.length; i = i + 1) {
            if (tab.url.indexOf(blacklist[i].title) !== -1) {
                blockTab(tab);
                return;
            }
        }
    });
}

function addEvents() {
    chrome.tabs.onRemoved.addListener(function () {
        refreshTodo();
    });

    chrome.windows.onCreated.addListener(function () {
        refreshTodo();
    });

    chrome.tabs.onCreated.addListener(function (tab) {
        refreshTodo();
        checkTabByUrl(tab);
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        refreshTodo();
        checkTabByUrl(tab);
    });

    chrome.runtime.onMessage.addListener((req, sender, resp) => {
        switch (req.action) {
            case 'saveConfig':
                saveConfig(req.data, resp);
                break;
            case 'getConfig':
                resp({
                    msg: 'get config ok',
                    data: config
                });
                break;
            case 'addTodo':
                refreshTodo();
                break;
            case 'removeTodo':
                refreshTodo();
                break;
            case 'blockUrl':
                blockUrl(req.data.url);
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

function init() {
    getSyncConfig(true, true).then(resp => {
        config = resp;
        addEvents();
        refreshTodo();
    }).catch(resp => {
        console.log(resp);
        addEvents();
        refreshTodo();
    });
}

init();
