/**
 * @file todo command plugin script
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var request = require('../common/request');

    var name = 'todolist';
    var key = 'todo';
    var icon = chrome.extension.getURL('img/todo.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function onInput(key) {
    }

    function onEnter(key, elem) {
        if (!elem || $(elem).data('type') === 'plugins') {
            addTodo.call(this, this.query);
        }
        else {
            removeTodo.call(this, key);
        }
    }

    function removeTodo(id) {
        var cmdbox = this;
        getTodos(function (todos) {
            todos = todos.filter(function (todo) {
                return todo.id !== id;
            });

            chrome.storage.sync.set({
                todo: todos

            }, function () {
                    cmdbox.empty();
                });
        });
    }

    function addTodo(todo) {
        var cmdbox = this;

        getTodos(function (todos) {
            if (!todos || !todos.length) {
                todos = [];
            }

            todos.push({
                id: +new Date(),
                title: todo

            });

            chrome.storage.sync.set({
                todo: todos

            }, function () {
                    cmdbox.empty();
                    noticeBg2refresh();
                });
        });
    }

    function noticeBg2refresh() {
        request.send({
            action: 'addTodo'

        });
    }

    function getTodos(callback) {
        chrome.storage.sync.get('todo', function (results) {
            var todos = results.todo;

            callback(todos);
        });
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: item.title,
                desc: subtitle

            };
        });
    }
    function showTodos() {
        var cmdbox = this;

        getTodos(function (todos) {
            cmdbox.showItemList(dataFormat(todos));
        });
    }

    module.exports = {
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        showTodos: showTodos,
        onInput: onInput,
        onEnter: onEnter

    };
});
