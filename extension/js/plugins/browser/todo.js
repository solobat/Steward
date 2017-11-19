/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import Toast from 'toastr'

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
        return Reflect.apply(addTodo, this, [this.query]);
    } else {
        return Reflect.apply(removeTodo, this, [item.id]);
    }
}

function removeTodo(id) {
    return new Promise(resolve => {
        getTodos(resp => {
            let todoName;

            const todos = resp.filter(function (todo) {
                if (todo.id === id) {
                    todoName = todo.title;
                }

                return todo.id !== id;
            });

            chrome.storage.sync.set({
                todo: todos
            }, () => {
                Toast.success(`[${todoName}] is done`, 'TodoList', { timeOut: 1000 });
                this.empty();
                noticeBg2refresh('removeTodo');
                resolve(false);
            });
        });
    });
}

function addTodo(todo) {
    if (!todo) {
        return;
    }

    return new Promise(resolve => {
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
                noticeBg2refresh('addTodo');
                Toast.success(`Add todo [${todo}]`, 'TodoList', { timeOut: 1000 });
                resolve(false);
            });
        });
    });
}

function noticeBg2refresh(action) {
    chrome.runtime.sendMessage({
        action
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
    onBoxEmpty: showTodos,
    onEnter
};