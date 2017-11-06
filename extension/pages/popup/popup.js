import './popup.scss'
import extension from '../../js/main/main'
import keyboardJS from 'keyboardjs'

if (window.parent === window) {
    extension('popup');
}

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        initForContentPage(event.source, event.data.host);
    }
});

function initForContentPage(parentWindow, parentHost) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;
    window.parentHost = parentHost;

    keyboardJS.bind('esc', () => {
        parentWindow.postMessage({
            action: 'closeBox'
        }, '*');
    });

    extension('popup', true);
}
