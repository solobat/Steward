/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */

// handle todos
function getTodos(callback) {
    chrome.storage.sync.get('todo', function (results) {
        var todos = results.todo;

        callback(todos);
    });
}

function getAllTabs(callback) {
    chrome.windows.getAll(function (wins) {
        if (!wins.length) {
            return;
        }
        var matchTabs = [];
        for (var i = 0, len = wins.length; i < len; i++) {
            // 闭包
            (function (index) {
                chrome.tabs.getAllInWindow(wins[index].id, function (tabs) {
                    if (index === len - 1) {
                        callback(tabs);
                    }
                });
            })(i);
        }
    });
}

function refreshTodo() {
    getTodos(function (todos) {
        if (!todos || !todos.length) {
            return;
        }
        getAllTabs(function (tabs) {
            for (var i = 0, len = todos.length; i < len; i++) {
                var tab = tabs[i];
                var todo = todos[i];

                if (!tab) {
                    return;
                }

                chrome.tabs.executeScript(tab.id, {
                    code: 'document.title = "' + todo.title + '"'
                });
            }
        });
    });
}

// handle url block
var blockPageUrl = chrome.extension.getURL('urlblock.html');
function getBlacklist(callback) {
    chrome.storage.sync.get('url', function (results) {
        var blacklist = results.url;

        callback(blacklist);
    });
}

function blockUrl (url) {
    if (!url) {
        return;
    }

    getAllTabs(function (tabs) {
        for (var i = 0; i < tabs.length; i++) {
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
        for (var i = 0; i < blacklist.length; i++) {
            if (tab.url.indexOf(blacklist[i].title) !== -1) {
                blockTab(tab);
                return;
            }
        }
    });
}

function addEvents() {
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        refreshTodo();
    });

    chrome.windows.onCreated.addListener(function (win) {
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

    chrome.tabs.onRemoved.addListener(function (tab) {
        refreshTodo();
    });

    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
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
