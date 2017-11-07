/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */
import _ from 'underscore'

// handle todos
function getTodos(callback) {
    chrome.storage.sync.get('todo', function (results) {
        const todos = results.todo;

        callback(todos);
    });
}

function getTabsByWindows(win) {
    return new Promise(resolve => {
        chrome.tabs.getAllInWindow(win.id, function (tabs) {
            resolve(tabs);
        });
    });
}

function getAllTabs(callback) {
    chrome.windows.getAll(function (wins) {
        if (!wins.length) {
            return;
        }
        const tasks = [];

        for (let i = 0, len = wins.length; i < len; i = i + 1) {
            tasks.push(getTabsByWindows(wins[i]));
        }

        Promise.all(tasks).then(resp => {
            callback(_.flatten(resp));
        });
    });
}

function refreshTodo() {
    getTodos(function (todos) {
        if (!todos || !todos.length) {
            return;
        }
        getAllTabs(function (tabs) {
            for (let i = 0, len = todos.length; i < len; i = i + 1) {
                const tab = tabs[i];
                const todo = todos[i];

                if (!tab) {
                    return;
                }

                chrome.tabs.executeScript(tab.id, {
                    code: `document.title = "${todo.title}"`
                });
            }
        });
    });
}

// handle url block
const blockPageUrl = chrome.extension.getURL('urlblock.html');
function getBlacklist(callback) {
    chrome.storage.sync.get('url', function (results) {
        const blacklist = results.url;

        callback(blacklist);
    });
}

function blockUrl (url) {
    if (!url) {
        return;
    }

    getAllTabs(function (tabs) {
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

    chrome.tabs.onRemoved.addListener(function () {
        refreshTodo();
    });

    chrome.extension.onRequest.addListener(function (request) {
        if (request.action === 'addTodo') {
            refreshTodo();
        }

        if (request.action === 'blockUrl') {
            blockUrl(request.data.url);
        }
    });
}

function init() {
    addEvents();
    refreshTodo();
}

init();

chrome.commands.onCommand.addListener(function(command) {
    if (command === 'open-in-content-page') {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "openBox"}, function() {});
        });
    }
});
