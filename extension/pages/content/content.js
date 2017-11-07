import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import { websitesMap } from '../../js/plugins/website'
const chrome = window.chrome;

const App = {
    isOpen: false,

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
        if (document.activeElement === this.$iframe[0]) {
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

        chrome.runtime.onMessage.addListener(req => {
            if (req.action === 'openBox') {
                if (this.isOpen) {
                    this.closeBox();
                } else {
                    this.openBox();
                }
            }
        });

        $(document).on('click', function(e) {
            if (that.isOpen && e.target.id !== 'steward-main') {
                that.closeBox();
            }
        });
    },

    init() {
        this.initDom();
        this.bindEvents();
    }
};

App.init();