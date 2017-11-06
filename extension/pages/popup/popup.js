import './popup.scss'
import $ from 'jquery'
import extension from '../../js/main/main'
import keyboardJS from 'keyboardjs'

if (window.parent === window) {
    extension('popup');
}

window.addEventListener('message', function(event) {
    if (event.data.ext_from === 'content') {
        if (event.data.action === 'show') {
            $('#cmdbox').focus();
        } else {
            initForContentPage(event.source, event.data.host);
        }
    }
});

function initForContentPage(parentWindow, parentHost) {
    document.documentElement.className += ' content-page';
    window.parentWindow = parentWindow;
    window.parentHost = parentHost;

    extension('popup', true).then(cmdbox => {
        keyboardJS.bind('esc', () => {
            cmdbox.empty();
            parentWindow.postMessage({
                action: 'closeBox'
            }, '*');
        });
    });
}
