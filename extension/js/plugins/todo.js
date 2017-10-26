/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import request from '../common/request'

const version = 2;
const name = 'todolist';
const key = 'todo';
const type = 'keyword';
const icon = chrome.extension.getURL('img/todo.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput(key) {
}

function onEnter(item) {
    if (!item || item.key === 'plugins') {
        addTodo.call(this, this.query);
    }
    else {
        removeTodo.call(this, item.id);
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

    if (!todo) {
        return;
    }

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
    let cmdbox = this;

    getTodos(function (todos) {
        cmdbox.showItemList(dataFormat(todos || []));
    });
}

export default {
    version,
    name: 'Todolist',
    icon,
    title,
    commands,
    showTodos,
    onInput,
    onEnter
};