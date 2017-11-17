/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import request from '../../common/request'

const version = 2;
const name = 'todolist';
const key = 'todo';
const type = 'keyword';
const icon = chrome.extension.getURL('img/todo.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function onInput() {
}

function onEnter(item) {
    if (!item || item.key === 'plugins') {
        Reflect.apply(addTodo, this, [this.query]);
    } else {
        Reflect.apply(removeTodo, this, [item.id]);
    }
}

function removeTodo(id) {
    getTodos(resp => {
        const todos = resp.filter(function (todo) {
            return todo.id !== id;
        });

        chrome.storage.sync.set({
            todo: todos
        }, () => {
            this.empty();
        });
    });
}

function addTodo(todo) {
    if (!todo) {
        return;
    }

    getTodos(resp => {
        let todos = resp;

        if (!todos || !todos.length) {
            todos = [];
        }

        todos.push({
            id: Number(new Date()),
            title: todo
        });

        chrome.storage.sync.set({
            todo: todos

        }, () => {
            this.empty();
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
        const todos = results.todo;

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
    getTodos(todos => {
        this.showItemList(dataFormat(todos || []));
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