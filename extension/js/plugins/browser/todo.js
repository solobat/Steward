/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import STORAGE from '../../constant/storage'
import browser from 'webextension-polyfill'

const version = 4;
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

const defaultResult = [{
    icon,
    title,
    desc: subtitle
}];

function onInput(query) {
    if (!query) {
        return getTodos().then(todos => {
            return dataFormat(todos || []);
        });
    } else {
        return Promise.resolve(defaultResult);
    }
}

function onEnter(item, command, query) {
    if (query) {
        return Reflect.apply(addTodo, this, [this.query, command]);
    } else {
        return Reflect.apply(removeTodo, this, [item.id]);
    }
}

function removeTodo(id) {
    return getTodos().then(resp => {
        let todoName;

        const todos = resp.filter(function (todo) {
            if (todo.id === id) {
                todoName = todo.title;
            }

            return todo.id !== id;
        });

        return browser.storage.sync.set({
            [STORAGE.TODO]: todos
        }).then(() => {
            Toast.success(`[${todoName}] is done`, 'TodoList', { timeOut: 1000 });

            return '';
        });
    });
}

function addTodo(todo, command) {
    if (!todo) {
        return Promise.resolve();
    }

    return util.isStorageSafe(STORAGE.TODO).then(() => {
        return getTodos().then(resp => {
            let todos = resp;

            if (!todos || !todos.length) {
                todos = [];
            }

            todos.push({
                id: Number(new Date()),
                title: todo
            });

            return browser.storage.sync.set({
                todo: todos
            }).then(() => {
                Toast.success(`Add todo [${todo}]`, 'TodoList', { timeOut: 1000 });

                return `${command.orkey} `;
            });
        });
    }).catch(() => {
        Toast.warning('Storage is full, can not be added!');

        return Promise.reject();
    });
}

function getTodos() {
    return browser.storage.sync.get(STORAGE.TODO).then(results => results.todo);
}

function dataFormat(rawList) {
    const doneDesc = chrome.i18n.getMessage('todolist_done_subtitle');

    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.title,
            desc: doneDesc
        };
    });
}
function showTodos() {
    getTodos().then(todos => {
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