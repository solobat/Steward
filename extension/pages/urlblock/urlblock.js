import ga from '../../js/common/ga'

chrome.runtime.onMessage.addListener(req => {
    if (req.action === 'back') {
        window.history.back();
    }
});
ga();