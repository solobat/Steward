/**
 * @desc pluginHelper
 */

const blockPageUrl = chrome.extension.getURL('urlblock.html');

function PluginHelper() {
    this.mode = '';
    this.original = '';
}

PluginHelper.prototype = {
    constructor: PluginHelper,

    tryMatchBlockPage(url) {
        return url.split('urlblock.html');
    },

    prepare() {
        const match = this.tryMatchBlockPage(window.location.href);

        if (match[1]) {
            this.mode = 'blocked';
            this.original = match[1];
        } else {
            this.mode = 'unblocked';
        }
    },

    block() {
        const url = window.location.href;

        window.history.pushState({}, document.title, url);
        window.location.href = `${blockPageUrl}?original=${url}`
    },

    unblock() {
        window.history.back();
    },

    checkBlock(blockedUrls) {
        if (this.mode === 'unblocked') {
            const url = window.location.href;
            const index = blockedUrls.findIndex(item => url.indexOf(item.title) !== -1);

            if (index !== -1) {
                this.block();
            }
        } else {
            const url = this.original;
            const index = blockedUrls.findIndex(item => url.indexOf(item.title) !== -1);

            if (index === -1) {
                this.unblock();
            }
        }
    },

    bindEvents() {
        chrome.storage.onChanged.addListener(changes => {
            if (changes.url) {
                this.checkBlock(changes.url.newValue);
            }
        });
    },

    init(blockedUrls) {
        this.prepare();
        this.bindEvents();
        this.checkBlock(blockedUrls);
    }
}

export default PluginHelper