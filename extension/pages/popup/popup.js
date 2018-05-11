import './popup.scss'
import extension from '../../js/main/main'
import keyboardJS from 'keyboardjs'
import { MODE } from '../../js/constant/base'
import { createWebsites } from '../../js/helper/websites'

if (window.parent === window) {
    extension(MODE.POPUP);
}

let box;

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        if (event.data.action === 'show') {
            changeBoxStatus(false, event.data.cmd);
        } else {
            const { host, meta, general } = event.data;

            createWebsites(event.source, host, meta, general).then(site => {
                if (site) {
                    window.matchedSite = site;
                }
                initForContentPage(event.source, event.data.lazy, event.data.host);
            });
        }
    }
});

function changeBoxStatus(disabled, cmd) {
    if (box) {
        box.ipt.attr('readonly', disabled);

        if (disabled) {
            box.empty(true);
            box.ipt.blur();
        } else {
            box.ipt.focus();
            if (cmd) {
                requestAnimationFrame(() => {
                    box.applyCmd(cmd);
                });
            }
        }
    }
}

function closeBox() {
    changeBoxStatus(true);
    requestAnimationFrame(() => {
        window.parentWindow.postMessage({
            action: 'closeBox'
        }, '*');
    });
}

function handleAction(event, obj) {
    window.parentWindow.postMessage(obj, '*');
}

function initForContentPage(parentWindow, lazy, parentHost) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;
    window.parentHost = parentHost;

    extension(MODE.POPUP, true).then(cmdbox => {
        box = cmdbox;
        // if lazy, inputbox should get the focus when init
        changeBoxStatus(!lazy);

        box.bind('shouldCloseBox', closeBox);
        box.bind('action', handleAction);
        keyboardJS.bind('esc', closeBox);

        parentWindow.postMessage({
            action: 'boxInited'
        }, '*');
    });
}
