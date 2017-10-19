import './popup.scss'
import extension from '../../js/main/main'
import keyboardJS from 'keyboardjs'

const chrome = window.chrome;

if (window.parent !== window) {
    extension('popup', true);
} else {
    extension('popup');
}

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        initForContentPage(event.source);
    }
});

function initForContentPage(parentWindow) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;

    keyboardJS.bind('esc', () => {
        parentWindow.postMessage({
            action: 'closeBox'
        }, '*');
    });
}
