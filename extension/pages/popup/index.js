import { initConfig, globalApi, clearToasts, installApp } from '../../main/main'
import keyboardJS from 'keyboardjs'
import { MODE } from 'constant/base'
import { createWebsites } from 'helper/websites.helper'
import axios from 'axios'
import Vue from 'vue';
import App from './App.vue';
Vue.config.productionTip = false;

function initApp(mode, inContent, meta) {
    return initConfig(mode, inContent).then(config => {
        globalApi(appData);
        const appData = {
            mode,
            data: { page: meta },
            inContent,
            config
        };

        const app = new Vue({
            el: '#app',
            data: {
                config
            },
            components: { App },
            template: '<App />'
        });

        installApp(app);

        return config;
    });
}

if (window.parent === window) {
    initApp(MODE.POPUP, false);
}

function toggleBookmark({ url, title, tag }) {
    chrome.bookmarks.search({ url }, resp => {
        if (resp && resp.length) {
            chrome.bookmarks.remove(resp[0].id, () => {});
        } else {
            const newTitle = `${tag}${title}`;

            chrome.bookmarks.create({
                title: newTitle,
                url
            });
        }
    });
}

function highlightEnglish(text) {
    const params = new URLSearchParams();

    params.append('text', text);

    return axios.post('https://english.edward.io/parse', params);
}

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        const action = event.data.action;
        const data = event.data.data;

        console.log(`action: ${action}`);

        if (action === 'show') {
            changeBoxStatus(false, event.data.cmd);
        } else if (action === 'init') {
            const { host, meta, general } = event.data;

            createWebsites(event.source, host, meta, general).then(site => {
                if (site) {
                    window.matchedSite = site;
                }
                initForContentPage(event.source, event.data.lazy, event.data.host, meta);
            });
        } else if (action === 'toggleBookmark') {
            toggleBookmark(data);
        } else if (action === 'highlightEnglishSyntax') {
            highlightEnglish(data.text).then(resp => {
                if (resp.data) {
                    event.source.postMessage({
                        action: 'highlightEnglishSyntax',
                        data: resp.data,
                        callbackId: event.data.callbackId
                    }, '*');
                }
            })
        }
    }
});

function changeBoxStatus(disabled, cmd) {
    window.Steward.app.emit('cmdbox:status', disabled, cmd);
}

function closeBox() {
    changeBoxStatus(true);
    requestAnimationFrame(() => {
        clearToasts();
        window.parentWindow.postMessage({
            action: 'closeBox'
        }, '*');
    });
}

function handleAction(obj) {
    window.parentWindow.postMessage(obj, '*');
}

function initForContentPage(parentWindow, lazy, parentHost, meta) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;
    window.parentHost = parentHost;

    initApp(MODE.POPUP, true, meta).then(() => {
        // if lazy, inputbox should get the focus when init
        changeBoxStatus(!lazy);

        window.Steward.app.on('shouldCloseBox', closeBox);
        window.Steward.app.on('action', handleAction);
        keyboardJS.bind('esc', closeBox);

        parentWindow.postMessage({
            action: 'boxInited'
        }, '*');
    });
}
