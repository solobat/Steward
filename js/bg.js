/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */

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

function refresh() {
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

function addEvents() {
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        refresh();
    });

    chrome.windows.onCreated.addListener(function (win) {
        refresh();
    });

    chrome.tabs.onCreated.addListener(function (tab) {
        refresh();
    });

    chrome.tabs.onUpdated.addListener(function (tab) {
        refresh();
    });

    chrome.tabs.onRemoved.addListener(function (tab) {
        refresh();
    });

    chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
        if (request.action === 'addTodo') {
            refresh();
        }
    });
}

function init() {
    addEvents();
    refresh();
}

init();
