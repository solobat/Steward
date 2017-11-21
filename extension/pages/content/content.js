import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import { websitesMap } from '../../js/plugins/website'
import PluginHelper from '../../js/helper/pluginHelper'

const chrome = window.chrome;
const pluginHelper = new PluginHelper();

const App = {
    isInit: false,
    isOpen: false,
    isLazy: false,

    initDom() {
        const popupurl = chrome.extension.getURL('popup.html');
        const html = `
            <div id="steward-main" class="steward-main">
                <iframe style="display:none;" id="steward-iframe" src="${popupurl}" name="steward-box" width="510" height="460" frameborder="0"></iframe>
            </div>
        `;

        $('body').append(html);
        this.$el = $('#steward-main');
        this.$iframe = $('#steward-iframe');
        this.$iframe.load(() => {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content',
                lazy: this.isLazy,
                host: window.location.host
            }, '*');
        });
    },
    openBox() {
        if (this.isOpen) {
            return;
        } else {
            this.isOpen = true;
        }

        this.$iframe.show().focus();
        setTimeout(() => {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content',
                action: 'show'
            }, '*');
        }, 25);
    },

    closeBox() {
        this.$iframe.hide();
        this.isOpen = false;
    },

    handleBoxInited() {
        // don't need to get the focus while inited
        if (!this.isLazy && document.activeElement === this.$iframe[0]) {
            document.activeElement.blur();
        }
    },

    bindEvents() {
        const that = this;
        const host = window.location.host;

        if (websitesMap[host]) {
            websitesMap[host].setup();
        }

        keyboardJS.bind('esc', function() {
            that.closeBox();
        });

        window.addEventListener('message', event => {
            const action = event.data.action;

            if (action === 'closeBox') {
                this.closeBox();
            } else if (action === 'boxInited') {
                this.handleBoxInited();
            }
        });

        $(document).on('click', function(e) {
            if (that.isOpen && e.target.id !== 'steward-main') {
                that.closeBox();
            }
        });
    },

    init(isLazy) {
        this.isLazy = isLazy;
        this.initDom();
        this.bindEvents();
        this.isInit = true;
    }
};

function toggleBox() {
    if (App.isOpen) {
        App.closeBox();
    } else {
        App.openBox();
    }
}

const initFactory = lazy => () => {
    if (!lazy) {
        App.init(lazy);
    }
    chrome.runtime.onMessage.addListener(req => {
        if (req.action === 'openBox') {
            if (lazy) {
                if (!App.isInit) {
                    App.init(lazy);
                }
            }
            toggleBox();
        }
    });
}

const quickInit = initFactory(false);
const lazyInit = initFactory(true);

chrome.runtime.sendMessage({
    action: 'getData'
}, resp => {
    const config = resp.data.config;

    pluginHelper.init(resp.data.blockedUrls);

    if (config.general.speedFirst) {
        quickInit();
    } else {
        lazyInit();
    }
})