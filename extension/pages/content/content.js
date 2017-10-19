import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
const chrome = window.chrome;

let App = {
    isOpen: false,

    initDom() {
        let html = `
            <div id="steward-main" class="steward-main" style="display:none;">
            </div>
        `;

        $('body').append(html);
        this.$el = $('#steward-main');
    },
    openBox() {
        let self = this;

        if (this.isOpen) {
            return;
        }

        let popupurl = chrome.extension.getURL('popup.html');
        let html = `
            <iframe id="steward-iframe" src="${popupurl}" name="steward-box" width="500" height="450" frameborder="0"></iframe>
        `;
        this.$el.html(html);
        this.$iframe = $('#steward-iframe');

        this.$el.show();
        this.$iframe.load(function() {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content'
            }, '*');
        });

        this.isOpen = true;
    },

    closeBox() {
        this.$el.empty().hide();
        this.isOpen = false;
    },

    bindEvents() {
        let self = this;

        keyboardJS.bind('esc', function() {
            self.closeBox();
        });

        window.addEventListener('message', (event) => {
            if (event.data.action === 'closeBox') {
                this.closeBox();
            }
        });

        chrome.runtime.onMessage.addListener((req, sender, resp) => {
            if (req.action === 'openBox') {
                this.openBox();
            }
        });

        $(document).on('click', function(e) {
            if (self.isOpen && e.target.id !== 'steward-main') {
                self.closeBox();
            }
        });
    },

    init() {
        this.initDom();
        this.bindEvents();
    }
};

App.init();