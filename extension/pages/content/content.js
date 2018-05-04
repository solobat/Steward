import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import { websitesMap } from '../../js/plugins/website'
import PluginHelper from '../../js/helper/pluginHelper'
import { checkAutoMatchingSites, getFavicon } from '../../js/helper/websites'
import { ITEM_TYPE } from '../../js/constant/base'

const chrome = window.chrome;
const pluginHelper = new PluginHelper();
const autoMatchingSites = checkAutoMatchingSites(selector => {
    return Boolean($(selector).length);
});

const App = {
    isInit: false,
    isOpen: false,
    isLazy: false,

    initDom() {
        const popupurl = chrome.extension.getURL('popup.html');
        const html = `
            <div id="steward-main" class="steward-main">
                <iframe style="display:none;" id="steward-iframe" src="${popupurl}" name="steward-box" width="530" height="480" frameborder="0"></iframe>
            </div>
        `;

        $('html').append(html);
        this.$el = $('#steward-main');
        this.$iframe = $('#steward-iframe');
        this.$iframe.on('load', () => {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content',
                lazy: this.isLazy,
                autoMatchingSites,
                host: window.location.host,
                meta: this.getMeta()
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

    postToIframe(msg) {
        const iframeWindow = document.getElementById('steward-iframe').contentWindow;

        iframeWindow.postMessage(msg, '*');
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

    handleQueryNavs(event) {
        if (event.data.selectors) {
            const items = $.makeArray($(event.data.selectors)).map(elem => {
                let text;
                const isLink = elem.tagName === 'A';

                if (elem.childNodes.length === 1) {
                    text = elem.innerText || elem.text;
                } else {
                    const lastNode = elem.childNodes[elem.childNodes.length - 1];

                    if (lastNode) {
                        text = lastNode.innerText || lastNode.text;
                    }

                    if (!text) {
                        $(elem.childNodes).each((index, node) => {
                            const title = node.innerText || node.text || node.textContent;

                            if (title) {
                                text = title;

                                return false;
                            }
                        });
                    }
                }

                return {
                    name: text,
                    path: elem.getAttribute('href'),
                    elem,
                    isLink
                }
            });

            const validItems = items.filter(item => {
                if (item.isLink) {
                    // eslint-disable-next-line
                    return item.name && item.path && item.path.indexOf('javascript:') === -1;
                } else {
                    return item.name;
                }
            });

            this.navItems = validItems;

            this.postToIframe({
                action: 'navs',
                navs: validItems.map(({ name, path}, index) => {
                        return {
                            name,
                            path,
                            index
                        };
                    })
            });
        }
    },

    handleGenOutline(event) {
        if (event.data.outlineScope) {
            const headerSels = 'h1,h2,h3,h4,h5,h6';

            function getLevelSymbol(level) {
                const spaces = new Array(level).join('&nbsp;&nbsp;');
                const levelSymbol = ['', '', '&#8729;', '&#9702;', '&#9702;', '&#9702;'];

                return spaces + levelSymbol[level] + new Array(2).join('&nbsp;');
            }

            const nodes = $.makeArray($(event.data.outlineScope).find(headerSels)) || [];

            this.headerElems = nodes;

            const items = nodes.filter(elem => {
                return elem.innerText !== '';
            }).map((elem, index) => {
                const level = Number(elem.tagName[1]);

                return {
                    name: getLevelSymbol(level) + elem.innerText,
                    index: index
                }
            });

            this.postToIframe({
                action: 'outline',
                outline: items
            });
        }
    },

    handleGetAnchors(event) {
        if (event.data.anchorsConfig) {
            const anchorsConfig = event.data.anchorsConfig;
            const items = anchorsConfig.map(conf => {
                return {
                    name: conf.title,
                    node: document.querySelector(conf.selector)
                };
            }).filter(item => item.node !== null);
            this.anchorNodes = items.map(item => item.node);

            this.postToIframe({
                action: 'anchors',
                anchors: items.map((item, index) => {
                    return {
                        name: item.name,
                        index
                    }
                })
            });
        }
    },

    handleCommand(event) {
        const { subType, index, path, custom } = event.data.info;

        if (subType === 'outline') {
            this.headerElems[index].scrollIntoView();
        } else if (subType === 'anchor') {
            this.anchorNodes[index].scrollIntoView();
        } else if (custom) {
            if (path) {
                window.location.href = path;
            } else {
                this.navItems[index].elem.click();
            }
        }
    },

    getMeta() {
        return {
            title: document.title,
            icon: getFavicon(document, window),
            url: window.location.href,
            host: window.location.host,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash
        };
    },

    handleGetMeta() {
        const meta = this.getMeta();
        const list = [
            { title: 'Title', desc: meta.title, key: ITEM_TYPE.COPY },
            { title: 'URL', desc: meta.url, key: ITEM_TYPE.COPY },
            { title: 'URL Host', desc: meta.host, key: ITEM_TYPE.COPY },
            { title: 'URL Path', desc: meta.pathname, key: ITEM_TYPE.COPY },
            { title: 'URL Search', desc: meta.search, key: ITEM_TYPE.COPY },
            { title: 'URL Hash', desc: meta.hash, key: ITEM_TYPE.COPY },
            { title: 'Source', desc: `open view-source:${meta.url}`, url: `view-source:${meta.url}`, key: ITEM_TYPE.URL }
        ];

        this.postToIframe({
            action: 'meta',
            meta: list
        });
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
            } else if (action === 'command') {
                this.handleCommand(event);
            } else if (action === 'queryNavs') {
                this.handleQueryNavs(event);
            } else if (action === 'genOutline') {
                this.handleGenOutline(event);
            } else if (action === 'getAnchors') {
                this.handleGetAnchors(event);
            } else if (action === 'getMeta') {
                this.handleGetMeta();
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