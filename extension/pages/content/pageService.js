import util from '../../js/common/util'
import keyboardJS from 'keyboardjs'
import axios from 'axios'
import $ from 'jquery'
import Enums from '../../js/enum'
import { getFavicon, getShareFields } from '../../js/helper/websites'
import 'is-in-viewport'

const { MessageType, BookmarkTag } = Enums;

export function getMeta() {
    const title = document.title || '';

    return {
        title,
        shortTitle: title.split(' ')[0],
        selection: (window.getSelection() || '').toString(),
        icon: getFavicon(document, window),
        url: window.location.href,
        host: window.location.host,
        pathname: window.location.pathname,
        baseURL: window.location.origin + window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        share: getShareFields(document, window)
    };
}

export function getElemsBySelector(selector, options = {}) {
    const scope = options.scope || 'document';
    let elems;

    if (scope === 'visible') {
        elems = $(`${selector}:visible`);
    } else if (scope === 'viewport') {
        elems = $(selector).filter(':in-viewport');
    } else {
        elems = $(selector);
    }

    return elems;
}

let navItems = [];

export function queryNavs(selectors) {
    const items = $.makeArray($(selectors)).map(elem => {
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

    navItems = validItems;

    return navItems;
}

export function gotoNav(index) {
    navItems[index].elem.click();
}

let headerElems = [];

export function generateOutline(outlineScope) {
    const headerSels = 'h1,h2,h3,h4,h5,h6';

    function getLevelSymbol(level) {
        const spaces = new Array(level).join(' ');
        const levelSymbol = ['', '', '-', ' -', '  -', '   -'];

        return spaces + levelSymbol[level] + new Array(2).join(' ');
    }

    const nodes = $.makeArray($(outlineScope).find(headerSels)) || [];

    headerElems = nodes;

    const inViewPortIndexes = [];
    const items = nodes.filter(elem => {
        return elem.innerText !== '';
    }).map((elem, index) => {
        const level = Number(elem.tagName[1]);

        if ($(elem).is(':in-viewport')) {
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

    return items;
}

export function scrollToOutline(index) {
    headerElems[index].scrollIntoView();
}

let anchorNodes = [];

export function getAnchors(anchorsConfig) {
    const items = anchorsConfig.map(conf => {
        return {
            name: conf.title,
            node: document.querySelector(conf.selector)
        };
    }).filter(item => item.node !== null);
    anchorNodes = items.map(item => item.node);

    return items;
}

export function scrollToAnchor(index) {
    anchorNodes[index].scrollIntoView();
}

export function handleClickCommand(selector, options) {
    const $elem = getElemsBySelector(selector, options, 'click')[0];

    if ($elem) {
        $elem.scrollIntoView();
        $elem.click();
    } else {
        util.toast.warning('Element not found');
    }
}

export function handleHideCommand(selector, options) {
    const $elems = getElemsBySelector(selector, options, 'hide');

    $elems.hide();
}

export function handleShowCommand(selector, options) {
    const $elems = getElemsBySelector(selector, options, 'show');

    $elems.show();
}

export function handleCopyCommand(selector, options) {
    const data = {
        ...getMeta()
    };
    let text;

    if (selector) {
        const elem = getElemsBySelector(selector, options, 'copy')[0];

        text = elem.value || elem.innerText;

        if (elem) {
            data.text = text;
        }
    }

    if (options.template) {
        text = util.simTemplate(options.template, data);
    }

    if (text) {
        util.copyToClipboard(text, true);
    } else {
        util.toast.warning('Element not found');
    }
}

export function toggleProtect() {
    if (window.onbeforeunload) {
        window.onbeforeunload = null;
    } else {
        window.onbeforeunload = function() {
            return "This page has been protect by yourself";
        }
    }
}

export function toggleBookmark({ url, title }, tag) {
    noticeApp({
        ext_from: 'content',
        action: MessageType.TOGGLE_BOOKMARK,
        data: {
            url,
            title,
            tag
        }
    });
}

export function toggleTodo(info) {
    toggleBookmark(info, BookmarkTag.TODO);
}

export function highlightEnglishSyntax(info, mouseTarget) {
    const $elem = getSuitableNode(getElemsBySelector(info.selector, info.extend), mouseTarget);

    if ($elem.length) {
        const text = $elem[0].innerText;
        if (text) {
            appBridge.invoke('highlightEnglishSyntax', {
                text
            }, resp => {
                if (resp) {
                    $elem.html(resp);
                }
            });
        }
    }
}

let actionCache = {
    $elem: null,
    subActions: null
};

function resetActionCache() {
    actionCache = {
        $elem: null,
        subActions: null
    };
}

function hideSiblings($el) {
    if ($el && $el.length) {
        $el.siblings().not('#steward-main,#wordcard-main').css({
            visibility: 'hidden',
            opacity: 0
        }).addClass('s-a-rm-hn');
        hideSiblings($el.parent())
    } else {
        console.log('Enter reading mode');
        keyboardJS.bind('esc', function showNode() {
            $('.s-a-rm-hn').css({
                visibility: 'visible',
                opacity: 1
            }).removeClass('s-a-rm-hn');
            console.log('Exit reading mode');
            execSubActions(actionCache.$elem, actionCache.subActions, 'leave');
            resetActionCache();
            keyboardJS.unbind('esc', showNode);
        });
    }
}

function getSuitableNode($elems, mouseTarget) {
    const elemHasFocus = Array.from($elems).find(elem => {
        return $.contains(elem, mouseTarget);
    });

    if (elemHasFocus) {
        return $(elemHasFocus);
    } else {
        const length = $elems.length;

        if (length < 2) {
            return $elems;
        } else if (length === 2) {
            return $elems.last();
        } else if (length > 2) {
            return $elems.eq(Math.floor(length / 2));
        }
    }
}

function execSubActions($elem, subActions, lifecycle = 'enter') {
    if ($elem && subActions) {
        subActions
            .filter(action => action.lifecycle === lifecycle)
            .forEach(action => {
                if (action.actionType && action.selector) {
                    try {
                        $elem.find(action.selector)[action.actionType](); 
                    } catch (error) {
                        console.log(error);
                    }
                }
            });
    }
}

export function readMode(info, mouseTarget) {
    const $elem = getSuitableNode(getElemsBySelector(info.selector, info.extend), mouseTarget);

    actionCache.$elem = $elem;
    actionCache.subActions = info.extend && info.extend.subActions;

    hideSiblings($elem);
    $elem[0].scrollIntoView();

    if (info.extend && info.extend.subActions) {
        execSubActions($elem, info.extend.subActions);
    }
}

export function replaceURL(url) {
    noticeBackground({
        ext_from: 'content',
        action: MessageType.REPLACE_URL,
        data: {
            url
        }
    });
}

// should refactor in v4.0
export function createBridge() {
    const callbacks = {}
    const registerFuncs = {}
    let cbId = 0

    const bridge = {
        invoke(action, data, callback) {
            cbId = cbId + 1;
            callbacks[cbId] = callback;
            noticeApp({
                action,
                ext_from: 'content',
                data,
                callbackId: cbId
            })
        },

        receiveMessage(msg) {
            const { action, data, callbackId, responstId } = msg;

            if (callbackId) {
                if (callbacks[callbackId]) {
                    callbacks[callbackId](data);
                    callbacks[callbackId] = null;
                }
            } else if (action) {
                if (registerFuncs[action]) {
                    let ret = {};
                    let flag = false;

                    registerFuncs[action].forEach(callback => {
                        callback(data, function(r) {
                            flag = true;
                            ret = Object.assign(ret, r);
                        });
                    });

                    if (flag) {
                        noticeApp({
                            responstId: responstId,
                            ret: ret
                        });
                    }
                }
            }
        },

        register: function(action, callback) {
            if (!registerFuncs[action]) {
                registerFuncs[action] = [];
            }
            registerFuncs[action].push(callback);
        }
    }

    return bridge;
}

export const appBridge = createBridge()

export function noticeApp(msg) {
    const iframeWindow = document.getElementById('steward-iframe').contentWindow;

    iframeWindow.postMessage(msg, '*');
}

export function noticeBackground(msg) {
    chrome.runtime.sendMessage(msg, resp => {
        console.log(resp);
    });
}