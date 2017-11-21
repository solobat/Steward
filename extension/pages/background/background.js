/**
 * @file background script
 * @author tomasy
 * @email solopea@gmail.com
 */
import $ from 'jquery'
import STORAGE from '../../js/constant/storage'
import { getSyncConfig } from '../../js/common/config'

let config = {};
let todos = [];
let blockedUrls = [];

function addEvents() {
    chrome.runtime.onMessage.addListener((req, sender, resp) => {
        switch (req.action) {
            case 'saveConfig':
                saveConfig(req.data, resp);
                break;
            case 'getData':
                resp({
                    msg: 'get data',
                    data: {
                        config,
                        todos,
                        blockedUrls
                    }
                });
                break;
            case 'getConfig':
                resp({
                    msg: 'get config ok',
                    data: config
                });
                break;
            case 'getTodos':
                resp({
                    msg: 'get todos ok',
                    data: todos
                });
                break;
            case 'getblockedUrls':
                resp({
                    msg: 'get urls ok',
                    data: blockedUrls
                });
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
        if (changes.todo) {
            todos = changes.todo.newValue;
            console.log('todo has changed...', todos);
        }
        if (changes.url) {
            blockedUrls = changes.url.newValue;
            console.log('url has changed...', blockedUrls);
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

function getTodos() {
    return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE.TODO, resp => {
            resolve(resp.todo || []);
        })
    });
}

function getblockedUrls() {
    return new Promise(resolve => {
        chrome.storage.sync.get(STORAGE.URL, resp => {
            resolve(resp.url || []);
        });
    });
}

function init() {
    Promise.all([
        getSyncConfig(true, true),
        getTodos(),
        getblockedUrls()
    ]).then(resp => {
        console.log(resp);
        config = resp[0];
        todos = resp[1];
        blockedUrls = resp[2];
        addEvents();
    }).catch(resp => {
        console.log(resp);
        addEvents();
    });
}

init();
