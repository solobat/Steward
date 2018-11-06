import util from '../common/util'
import $ from 'jquery'
import { Website as WebsiteModel, WebsiteList } from '../collection/website'
import resolveUrl from 'resolve-url'
import QRCode from 'qrcode'
import * as ResultHelper from './resultHelper'
import { generateSocialUrls, addNetworkRecord } from '../../lib/social-share-urls'
import minimatch from 'minimatch'
import constant from '../constant'

const websiteList = new WebsiteList();

export const filterByName = (suggestions, text) => util.getMatches(suggestions, text, 'name');
export const filterByPath = (suggestions, text) => util.getMatches(suggestions, text, 'path');

const TRIGGER_SYMBOL = {
    PATH: '/',
    OUTLINE: '`',
    ANCHOR: '#',
    META: `'`,
    URL: ',',
    SHARE: '@'
};

export function getFavicon(context = document, win) {
    let favicon = '/favicon.ico';
    const nodeList = context.getElementsByTagName("link");

    for (let i = 0; i < nodeList.length; i += 1) {
        const rel = (nodeList[i].getAttribute('rel') || '').toLowerCase();

        if((rel === 'icon') ||
            (rel === 'shortcut icon')) {
            favicon = nodeList[i].getAttribute("href");
        }
    }

    const { protocol, host, pathname } = win.location;

    if (favicon.startsWith('http')) {
        return favicon;
    } else if (favicon.startsWith('//')) {
        return `${protocol}${favicon}`;
    } else if (favicon.startsWith('.') || !favicon.startsWith('/')) {
        if (favicon.startsWith('/')) {
            favicon += '.';
        }
        return resolveUrl(pathname, favicon);
    } else {
        return `${protocol}//${host}${favicon}`;
    }
}

export function getShareFields(context, win) {
    const elems = Array.from(context.querySelectorAll('meta[property^="og:"]'));

    function getTitle(title) {
        return win.getSelection().toString() || title;
    }

    if (elems.length) {
        const info = {};

        elems.forEach(elem => {
            const property = elem.getAttribute('property');
            const content = elem.getAttribute('content');
            const key = property.split(':')[1];

            if (key) {
                info[key] = content;
            }
        });

        const img = info.img || info.image;
        const desc = info.desc || info.description;

        info.img = info.image = img;
        info.desc = info.description = desc;
        info.title = getTitle(info.title);

        return info;
    } else {
        const imgElem = context.querySelector('img');
        let img = '';

        if (imgElem) {
            img = imgElem.getAttribute('src');
        }
        return {
            title: getTitle(context.title),
            img
        };
    }
}

function handlePaths(paths, vars) {
    return paths.map(path => {
        return {
            name: path.title,
            path: util.simTemplate(path.urlPattern, vars || {})
        };
    });
}

export class Website {
    constructor(options, parentWindow, pageMeta, generalConfig) {
        this.name = options.name;
        this.type = 'search';
        this.icon = options.icon;
        this.host = options.host;
        this.parentWindow = parentWindow;
        this.navs = options.navs || 'nav ul li a';
        this.outlineScope = options.outlineScope || '';
        this.paths = [];
        this.customPaths = handlePaths(options.paths, options.vars) || [];
        this.anchors = [];
        this.anchorsConfig = options.anchors || [];
        this.isDefault = options.isDefault;
        this.meta = [];
        this.urls = [];
        this.pageMeta = pageMeta || {};
        this.shareUrls = [];
        this.init(generalConfig);
        this.bindEvents();
    }

    init(generalConfig = {}) {
        this.config = generalConfig;
        requestAnimationFrame(() => {
            this.handleMetaInfo(this.config.websiteUrls);

            if (this.config.websiteShareUrls) {
                this.generateShareUrls();
            }
        });
    }

    bindEvents() {
        window.addEventListener('message', event => {
            const { data } = event;

            if (data.action === 'navs') {
                if (event.data.navs.length) {
                    this.paths = this.customPaths.concat(event.data.navs);
                } else {
                    this.paths = this.customPaths;
                }
            } else if (data.action === 'outline') {
                if (data.outline.length) {
                    this.outline = data.outline;
                }
            } else if (data.action === 'anchors') {
                if (data.anchors.length) {
                    this.anchors = data.anchors;
                }
            } else if (data.action === 'show') {
                this.handleBoxShow();
            } else if (data.action === 'meta') {
                this.handleMeta(data.meta, data.rawMeta);
            }
        });

        document.addEventListener('stewardReady', event => {
            const app = event.detail.app;

            app.on('afterExecCommand', (...args) => {
                this.afterExecCommand(...args);
            });
        });
    }

    handleMetaInfo(websiteUrls) {
        const metaInfo = this.pageMeta;

        if (websiteUrls) {
            QRCode.toDataURL(metaInfo.url).then(url => {
                return ResultHelper.createUrl({
                    url, title: 'QR code', icon: metaInfo.icon, showDesc: true, desc: metaInfo.url
                });
            }).then(item => this.urls.push(item));
        }
    }

    generateShareUrls() {
        const shareInfo = Object.assign({}, this.pageMeta, this.pageMeta.share);

        Reflect.deleteProperty(shareInfo, 'share');

        generateSocialUrls(shareInfo).then(links => {
            this.shareUrls = links.map(item => {
                let icon;

                if (item.class.startsWith('http')) {
                    icon = item.class;
                } else {
                    icon = chrome.extension.getURL(`iconfont/share-icons/${item.class}.svg`);
                }

                return ResultHelper.createUrl({
                    url: item.url, title: item.name, icon
                });
            });
        })
    }

    handleBoxShow() {
        this.getMeta();
        this.findNavs();
        this.genOutline();
        this.getAnchors();
    }

    handleMeta(metaItems = [], rawMeta) {
        metaItems.forEach(item => {
            item.icon = this.icon;
            item.universal = true;
        });

        this.meta = metaItems.filter(item => item.desc || item.url);
        this.pageMeta = rawMeta;
        if (this.config.websiteShareUrls) {
            this.generateShareUrls();
        }
    }

    getMeta() {
        this.parentWindow.postMessage({
            action: 'getMeta'
        }, '*');
    }

    findNavs() {
        const navSelectors = this.navs.trim();

        if (navSelectors) {
            this.parentWindow.postMessage({
                action: 'queryNavs',
                selectors: navSelectors
            }, '*');
        }
    }

    genOutline() {
        const outlineScope = this.outlineScope.trim();

        if (outlineScope) {
            this.parentWindow.postMessage({
                action: 'genOutline',
                outlineScope: outlineScope
            }, '*');
        }
    }

    getAnchors() {
        if (this.anchorsConfig.length) {
            this.parentWindow.postMessage({
                action: 'getAnchors',
                anchorsConfig: this.anchorsConfig
            }, '*');
        }
    }

    onInput(text) {
        const cnNameFilter = item => util.matchText(text, item.name + item.path);
        const outlineNameFilter = item => util.matchText(text.slice(1), item.name);
        const anchorNameFilter = outlineNameFilter;
        const metaFilter = item => util.matchText(text.slice(1), item.title);
        const mapTo = (key, subType) => item => {
            return {
                icon: this.icon,
                key,
                subType,
                index: item.index,
                title: item.name,
                desc: item.path,
                path: item.path,
                deps: item.deps,
                isCurrent: item.isCurrent,
                custom: true
            }
        };

        const first = text[0];

        this.triggerSymbol = first;
        if (first === TRIGGER_SYMBOL.PATH) {
            if (text === TRIGGER_SYMBOL.PATH) {
                return Promise.resolve(this.paths.map(mapTo('action')));
            } else {
                return Promise.resolve(filterByPath(this.paths, text).map(mapTo('action')));
            }
        } else if (first === TRIGGER_SYMBOL.OUTLINE) {
            return Promise.resolve(this.outline.filter(outlineNameFilter).map(mapTo('action', 'outline')));
        } else if (first === TRIGGER_SYMBOL.ANCHOR) {
            return Promise.resolve(this.anchors.filter(anchorNameFilter).map(mapTo('action', 'anchor')));
        } else if (first === TRIGGER_SYMBOL.META) {
            return Promise.resolve(this.urls.concat(this.meta).filter(metaFilter));
        } else if (first === TRIGGER_SYMBOL.SHARE) {
            return Promise.resolve(this.shareUrls.filter(metaFilter));
        } else if (first) {
            return Promise.resolve(this.paths.filter(cnNameFilter).map(mapTo('action')));
        }
    }

    afterExecCommand(item) {
        console.log(item);
        if (this.triggerSymbol === TRIGGER_SYMBOL.SHARE) {
            addNetworkRecord(item.title);
        }
    }
}

function getDefaultSiteInfo(meta) {
    return {
        title: meta.title,
        host: meta.host,
        icon: meta.icon,
        paths: [],
        navs: 'nav a,.nav a,.header-nav a,.topbar a,#topnav a,.nav-wrapper a,.topnav a',
        disabled: false,
        outlineScope: '.markdown-section,#js_article,.doc-article-inner,.theme-container .page .content',
        isDefault: true,
        anchors: []
    };
}

export function createWebsites(parentWindow, host, meta, general = {}) {
    return helper.init().then(sites => {
        let mixedSites = sites.filter(site => {
            const isMatch = site.host.startsWith('http') ? minimatch(meta.baseURL, site.host) : host === site.host;

            return isMatch && !site.disabled;
        });

        if (general.autoCreateWebsite) {
            mixedSites = mixedSites.concat(getDefaultSiteInfo(meta));
        }

        if (mixedSites[0]) {
            return new Website(mixedSites[0], parentWindow, meta, general);
        } else {
            return null;
        }
    });
}

const helper = {
    key: 'websites',

    create(info) {
        if (info.title && info.host) {
            const website = new WebsiteModel();

            website.set(info);

            return Promise.resolve(websiteList.chromeStorage.create(website).then(() => {
                return this.refresh().then(() => {
                    return website;
                });
            }));
        } else {
            return Promise.reject('no title or host');
        }
    },

    remove(id) {
        const model = websiteList.remove(id);

        return Promise.resolve(websiteList.chromeStorage.destroy(model).then(() => {
            return this.refresh();
        }));
    },

    getDefaultSiteInfo,

    update(attrs) {
        const diary = websiteList.set(attrs, {
            add: false,
            remove: false
        });

        return Promise.resolve(diary.save().then(() => {
            return diary;
        }));
    },

    save(info) {
        if (info.id) {
            return this.update(info);
        } else {
            return this.create(info);
        }
    },

    refresh() {
        return new Promise((resolve, reject) => {
            websiteList.fetch().done(resp => {
                resolve(resp);
            }).fail(resp => {
                reject(resp);
            });
        });
    },

    checkWebsiteStatus(website) {
        const uid = `${website.author}/${website.host}`;
        const result = this.getWebsiteList().find(item => {
            const theUid = `${item.author}/${item.host}`;

            return theUid === uid;
        });

        if (result) {
            if (website.version > result.version) {
                website.id = result.id;

                return constant.BASE.WEBSITE_STATUS.NEWVESION;
            } else {
                return constant.BASE.WEBSITE_STATUS.INSTALLED;
            }
        } else {
            return constant.BASE.WEBSITE_STATUS.NOTINSTALL;
        }
    },

    checkWebsiteByHost(host) {
        const result = this.getWebsiteList().find(item => {
            return item.host === host;
        });

        if (result) {
            return constant.BASE.WEBSITE_STATUS.INSTALLED;
        } else {
            return constant.BASE.WEBSITE_STATUS.NOTINSTALL;
        }
    },

    getWebsiteList() {
        return websiteList.toJSON();
    },

    getData() {
        return this.refresh().then(() => {
            const list = this.getWebsiteList();

            return list;
        });
    },

    setData(list) {
        if (list && list.length) {
            const models = websiteList.set(list);

            models.forEach(model => {
                model.save();
            });

            return Promise.resolve(models);
        } else {
            return Promise.resolve('no websites');
        }
    },

    init() {
        return this.getData();
    }
}

export default helper