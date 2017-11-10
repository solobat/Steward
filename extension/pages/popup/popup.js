import './popup.scss'
import extension from '../../js/main/main'
import keyboardJS from 'keyboardjs'

if (window.parent === window) {
    extension('popup');
}

let box;

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        if (event.data.action === 'show') {
            changeBoxStatus(false);
        } else {
            initForContentPage(event.source, event.data.host);
        }
    }
});

function changeBoxStatus(disabled) {
    if (box) {
        box.ipt.attr('readonly', disabled);

        if (disabled) {
            box.empty();
            box.ipt.blur();
        } else {
            box.ipt.focus();
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

function initForContentPage(parentWindow, parentHost) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;
    window.parentHost = parentHost;

    extension('popup', true).then(cmdbox => {
        box = cmdbox;
        changeBoxStatus(true);

        box.bind('shouldCloseBox', closeBox);
        box.bind('action', handleAction);
        keyboardJS.bind('esc', closeBox);

        parentWindow.postMessage({
            action: 'boxInited'
        }, '*');
    });
}
