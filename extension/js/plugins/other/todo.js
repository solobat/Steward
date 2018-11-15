/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'
import STORAGE from '../../constant/storage'
import browser from 'webextension-polyfill'

const version = 5;
const name = 'todolist';
const keys = [
    { key: 'todo' },
    { key: 'done', shiftKey: true }
];
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/todo.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function handleTodoInput(query, command) {
    if (!query) {
        return getTodos().then(todos => {
            if (todos && todos.length) {
                return dataFormat(todos || [], command);
            } else {
                return util.getDefaultResult(command);
            }
        });
    } else {
        return util.getDefaultResult(command);
    }
}

function handleDoneInput(query, command) {
    return getDones().then((dones = []) => {
        return dones.filter(todo => util.matchText(query, todo.title));
    }).then(todos => {
        if (query) {
            return dataFormat(todos || [], command);
        } else {
            if (todos && todos.length) {
                return dataFormat(todos, command);
            } else {
                return util.getDefaultResult(command);
            }
        }
    });
}

function onInput(query, command) {
    const orkey = command.orkey;

    if (orkey === 'todo') {
        return handleTodoInput(query, command);
    } else if (orkey === 'done') {
        return handleDoneInput(query, command);
    }
}

function handleTodoEnter(item, command, query) {
    if (query) {
        return addTodo(query, command);
    } else {
        return removeTodo({ id: item.id, title: item.title });
    }
}

function handleDoneEnter(item, command, query, { shiftKey }) {
    if (item) {
        const todo = {
            id: item.id,
            title: item.title
        };

        if (shiftKey) {
            return deleteDone(todo).then(() => {
                Toast.success(util.simTemplate(chrome.i18n.getMessage('delete_ok_tpl'), {
                    text: todo.title
                }));

                return '';
            });
        } else {
            return deleteDone(todo).then(addTodo);
        }
    }
}

function onEnter(item, command, query, shiftKey) {
    const orkey = command.orkey;

    if (orkey === 'todo') {
        return handleTodoEnter(item, command, query);
    } else if (orkey === 'done') {
        return handleDoneEnter(item, command, query, shiftKey);
    }
}

function removeTodo(item) {
    return getTodos().then(resp => {
        let todoName;

        const todos = resp.filter(function (todo) {
            if (todo.id === item.id) {
                todoName = todo.title;
            }

            return todo.id !== item.id;
        });

        return browser.storage.sync.set({
            [STORAGE.TODO]: todos
        }).then(() => {
            Toast.success(`[${todoName}] is done`, 'TodoList', { timeOut: 1000 });

            return addDoneTodoToLocal(item);
        }).then(() => {
            return '';
        });
    });
}

function addDoneTodoToLocal(todo) {
    return getDones().then((dones = []) => {
        dones.unshift(todo);

        return dones;
    }).then(dones => {
        return browser.storage.local.set({
            [STORAGE.DONE]: dones
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
            let todoText;

            if (!todos || !todos.length) {
                todos = [];
            }

            if (todo.id) {
                todos.push(todo);
                todoText = todo.title;
            } else {
                todoText = todo;
                todos.push({
                    id: Number(new Date()),
                    title: todo
                });
            }

            return browser.storage.sync.set({
                todo: todos
            }).then(() => {
                Toast.success(`Add todo [${todoText}]`, 'TodoList', { timeOut: 1000 });

                if (command) {
                    return `${command.key} `;
                } else {
                    return '';
                }
            });
        });
    }).catch(() => {
        Toast.warning(chrome.i18n.getMessage('STORAGE_WARNING'));

        return Promise.reject();
    });
}

function deleteDone(todo) {
    return getDones().then((dones = []) => {
        const newDones = dones.filter(item => item.id !== todo.id);

        return browser.storage.local.set({
            [STORAGE.DONE]: newDones
        }).then(() => {
            return todo;
        });
    });
}

function getDones() {
    return browser.storage.local.get(STORAGE.DONE).then(results => results[STORAGE.DONE]);
}

function getTodos() {
    return browser.storage.sync.get(STORAGE.TODO).then(results => results[STORAGE.TODO]);
}

function dataFormat(rawList, command) {
    return rawList.map(function (item) {
        return {
            key: 'plugin',
            id: item.id,
            icon: icon,
            title: item.title,
            desc: command.subtitle
        };
    });
}
function showTodos() {
    getTodos().then(todos => {
        window.stewardApp.updateList(dataFormat(todos || []));
    });
}

export default {
    version,
    name: 'Todolist',
    category: 'other',
    icon,
    title,
    commands,
    showTodos,
    onInput,
    onEnter,
    canDisabled: true
};