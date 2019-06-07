/*global EXT_TYPE*/
import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import PluginHelper from '../../js/helper/pluginHelper'
import Enums from '../../js/enum'
import { ITEM_TYPE } from '../../js/constant/base'
import * as pageService from './pageService'
import { shorten } from '../../lib/shorturl'

const { MessageType, PageCommand, PageAction } = Enums;
const chrome = window.chrome;
const pluginHelper = new PluginHelper();

function getHtml() {
    return getMainHtml();
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

const App = {
    isInit: false,
    isOpen: false,
    isLazy: false,

    cache: {
        shorturl: '',
        mouseTarget: null
    },

    initDom() {
        return new Promise(resolve => {
            $('html').append(getHtml());
            this.$el = $('#steward-main');
            this.$iframe = $('#steward-iframe');
            this.$iframe.on('load', () => {
                pageService.noticeApp({
                    ext_from: 'content',
                    action: MessageType.INIT,
                    lazy: this.isLazy,
                    host: window.location.host,
                    meta: pageService.getMeta(),
                    general: this.config.general
                });

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
            pageService.noticeApp({
                ext_from: 'content',
                action: MessageType.SHOW,
                cmd: cmd
            });
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

    handleQueryNavs(event) {
        if (event.data.selectors) {
            const validItems = pageService.queryNavs(event.data.selectors);

            pageService.noticeApp({
                action: MessageType.NAVS,
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
            const items = pageService.generateOutline(event.data.outlineScope);

            pageService.noticeApp({
                action: MessageType.OUTLINE,
                outline: items
            });
        }
    },

    handleGetAnchors(event) {
        if (event.data.anchorsConfig) {
            const items = pageService.getAnchors(event.data.anchorsConfig);

            pageService.noticeApp({
                action: MessageType.ANCHORS,
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

        if (subType === PageCommand.OUTLINE) {
            pageService.scrollToOutline(index);
        } else if (subType === PageCommand.ANCHOR) {
            pageService.scrollToAnchor(index);
        } else if (subType === PageCommand.CLICK) {
            pageService.handleClickCommand(selector, extend);
        } else if (subType === PageCommand.HIDE) {
            pageService.handleHideCommand(selector, extend);
        } else if (subType === PageCommand.SHOW) {
            pageService.handleShowCommand(selector, extend);
        } else if (subType === PageCommand.COPY) {
            pageService.handleCopyCommand(selector, extend);
        } else if (subType === PageCommand.PAGE_PROTECT) {
            pageService.toggleProtect();
        } else if (subType === PageCommand.TOGGLE_TODO) {
            pageService.toggleTodo(pageService.getMeta());
        } else if (subType === PageCommand.ENGLISH_SYNTAX_HIGHLIGHT) {
            pageService.highlightEnglishSyntax(event.data.info, this.cache.mouseTarget);
        } else if (subType === PageCommand.READ_MODE) {
            pageService.readMode(event.data.info, this.cache.mouseTarget);
        } else if (custom) {
            if (path) {
                window.location.href = path;
            } else {
                pageService.gotoNav(index);
            }
        }
    },

    getShorturl(url) {
        if (this.cache.shorturl) {
            return Promise.resolve(this.cache.shorturl);
        } else {
            return shorten(url).then(resp => {
                this.cache.shorturl = resp;

                return resp;
            });
        }
    },

    handleGetMeta() {
        const meta = pageService.getMeta();
        const list = [
            { title: 'Title', desc: meta.title, key: ITEM_TYPE.COPY },
            { title: 'URL', desc: meta.url, key: ITEM_TYPE.COPY },
            { title: 'URL Host', desc: meta.host, key: ITEM_TYPE.COPY },
            { title: 'URL Path', desc: meta.pathname, key: ITEM_TYPE.COPY },
            { title: 'URL Search', desc: meta.search, key: ITEM_TYPE.COPY },
            { title: 'URL Hash', desc: meta.hash, key: ITEM_TYPE.COPY },
            { title: 'Source', desc: `open view-source:${meta.url}`, url: `view-source:${meta.url}`, key: ITEM_TYPE.URL }
        ];

        function notice() {
            pageService.noticeApp({
                action: 'meta',
                meta: list,
                rawMeta: meta
            });
        }

        this.getShorturl(meta.url).then(shorturl => {
            list.unshift({
                title: 'Short url',
                desc: shorturl,
                key: ITEM_TYPE.COPY
            });
            notice();
        }).catch(() => {
            notice();
        });
    },

    handleGetIframes() {
        const iframes = Array.from(document.querySelectorAll('iframe')).map(node => {
            return {
                title: node.src,
                icon: chrome.extension.getURL('iconfont/iframe.svg'),
                url: node.src,
                key: ITEM_TYPE.URL
            };
        }).filter(item => {
            if (item.url && !item.url.match(/^chrome-extension:\/\//)) {
                return true;
            } else {
                return false;
            }
        });

        pageService.noticeApp({
            action: MessageType.IFRAMES,
            iframes
        });
    },

    bindEvents() {
        const that = this;

        keyboardJS.bind('esc', function() {
            that.closeBox();
        });

        window.addEventListener('message', event => {
            const { action, callbackId } = event.data;

            if (callbackId) {
                pageService.appBridge.receiveMessage(event.data);
            } else if (action === PageAction.CLOSE_BOX) {
                this.closeBox();
            } else if (action === PageAction.BOX_INITED) {
                this.handleBoxInited();
            } else if (action === PageAction.COMMAND) {
                this.handleCommand(event);
            } else if (action === PageAction.QUERY_NAVS) {
                this.handleQueryNavs(event);
            } else if (action === PageAction.GEN_OUTLINE) {
                this.handleGenOutline(event);
            } else if (action === PageAction.GET_ANCHORS) {
                this.handleGetAnchors(event);
            } else if (action === PageAction.GET_META) {
                this.handleGetMeta();
            } else if (action === PageAction.GET_IFRAMES) {
                this.handleGetIframes();
            }
        });

        $(document).on('click', function(e) {
            if (that.isOpen && e.target.id !== 'steward-main') {
                that.closeBox();
            }
        });

        $(document).on('mouseover', function(e) {
            if (that.isInit && !that.isOpen) {
                that.cache.mouseTarget = e.target;
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