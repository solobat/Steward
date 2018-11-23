/*global EXT_TYPE*/
import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import PluginHelper from '../../js/helper/pluginHelper'
import { getFavicon, getShareFields } from '../../js/helper/websites'
import { ITEM_TYPE } from '../../js/constant/base'
import util from '../../js/common/util'

const chrome = window.chrome;
const pluginHelper = new PluginHelper();
const shouldInstead = window.location.href === 'https://lai.app/' && EXT_TYPE === 'stewardlite';

function insertCss() {
    const customStyles = document.createElement('style');

    customStyles.innerHTML = `
        body {
            display: none!important;
        }
    `;
    document.documentElement.insertBefore(customStyles, null);
}

if (shouldInstead) {
    insertCss();
}

$.fn.isInViewport = function() {
    const elementTop = $(this).offset().top;
    const elementBottom = elementTop + $(this).outerHeight();
    const viewportTop = $(window).scrollTop();
    const viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};

function getHtml() {
    if (shouldInstead) {
        return getNewTabHtml();
    } else {
        return getMainHtml();
    }
}

function getMainHtml() {
    const popupurl = chrome.extension.getURL('popup.html');
    const html = `
        <div id="steward-main" class="steward-main">
            <iframe style="display:none;" id="steward-iframe" src="${popupurl}" name="steward-box" width="530" height="480" frameborder="0"></iframe>
        </div>
    `;

    return html;
}

function getNewTabHtml() {
    const popupurl = chrome.extension.getURL('steward.html');
    const html = `
        <div id="steward-main" class="steward-main newtab">
            <iframe id="steward-iframe" src="${popupurl}" name="steward-box" width="100%" height="100%" frameborder="0"></iframe>
        </div>
    `;

    return html;
}

const App = {
    isInit: false,
    isOpen: false,
    isLazy: false,

    initDom() {
        return new Promise(resolve => {
            $('html').append(getHtml());
            this.$el = $('#steward-main');
            this.$iframe = $('#steward-iframe');
            this.$iframe.on('load', () => {
                const iframeWindow = document.getElementById('steward-iframe').contentWindow;

                iframeWindow.postMessage({
                    ext_from: 'content',
                    lazy: this.isLazy,
                    host: window.location.host,
                    meta: this.getMeta(),
                    general: this.config.general
                }, '*');

                resolve();
            });
        });
    },
    openBox(cmd) {
        if (this.isOpen && !cmd) {
            return;
        } else {
            this.isOpen = true;
        }

        this.$iframe.show().focus();
        setTimeout(() => {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content',
                action: 'show',
                cmd: cmd
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
                const spaces = new Array(level).join(' ');
                const levelSymbol = ['', '', '-', ' -', '  -', '   -'];

                return spaces + levelSymbol[level] + new Array(2).join(' ');
            }

            const nodes = $.makeArray($(event.data.outlineScope).find(headerSels)) || [];

            this.headerElems = nodes;

            const inViewPortIndexes = [];
            const items = nodes.filter(elem => {
                return elem.innerText !== '';
            }).map((elem, index) => {
                const level = Number(elem.tagName[1]);

                if ($(elem).isInViewport()) {
                    inViewPortIndexes.push(index);
                }

                return {
                    name: getLevelSymbol(level) + elem.innerText,
                    index: index
                }
            });

            if (inViewPortIndexes.length) {
                items[inViewPortIndexes.pop()].isCurrent = true;
            }

            console.log(items);

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
        const { subType, index, path, custom, selector, extend = {} } = event.data.info;

        if (subType === 'outline') {
            this.headerElems[index].scrollIntoView();
        } else if (subType === 'anchor') {
            this.anchorNodes[index].scrollIntoView();
        } else if (subType === 'click') {
            const elem = document.querySelector(selector);

            if (elem) {
                elem.scrollIntoView();
                elem.click();
            } else {
                util.toast('Element not found');
            }
        } else if (subType === 'copy') {
            const elem = document.querySelector(selector);

            if (elem) {
                let text = elem.value || elem.innerText;

                if (extend.template) {
                    text = util.simTemplate(extend.template, { text });
                }

                util.copyToClipboard(text, true);
            } else {
                util.toast('Element not found');
            }
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
            baseURL: window.location.origin + window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            share: getShareFields(document, window)
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
            meta: list,
            rawMeta: meta
        });
    },

    bindEvents() {
        const that = this;

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

    init(config, isLazy) {
        this.config = config;
        this.isLazy = isLazy;
        this.bindEvents();
        this.isInit = true;

        return this.initDom();
    }
};

function toggleBox(cmd) {
    if (App.isOpen && !cmd) {
        App.closeBox();
    } else {
        App.openBox(cmd);
    }
}

const initFactory = lazy => config => {
    if (!lazy) {
        App.init(config, lazy);
    }
    chrome.runtime.onMessage.addListener(req => {
        if (req.action === 'openBox') {
            if (lazy) {
                if (!App.isInit) {
                    App.init(config, lazy).then(() => {
                        toggleBox(req.cmd);
                    });
                } else {
                    toggleBox(req.cmd);
                }
            } else {
                toggleBox(req.cmd);
            }
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
        quickInit(config);
    } else {
        lazyInit(config);
    }
})