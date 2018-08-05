import util from '../common/util'
import { WebsiteList } from '../collection/website'
import resolveUrl from 'resolve-url'
import QRCode from 'qrcode'
import shortUrlCn from 'url-shorten.china'
import * as ResultHelper from './resultHelper'
import { generateSocialUrls } from '../../lib/social-share-urls'

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

export function getShareFields(context) {
    const elems = Array.from(context.querySelectorAll('meta[property^="og:"]'));

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

        return info;
    } else {
        return null;
    }
}

export function handlePath(path, info, deps) {
    if (info.deps) {
        let realPath = path;

        info.deps.forEach(field => {
            realPath = realPath.replace(`{{${field}}}`, deps[field]);
        });

        window.location.href = realPath;
    } else {
        window.location.href = path;
    }
}

function handlePaths(paths) {
    return paths.map(path => {
        return {
            name: path.title,
            path: path.urlPattern
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
        this.customPaths = handlePaths(options.paths, options.deps) || [];
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
        requestAnimationFrame(() => {
            this.handleMetaInfo(generalConfig.websiteUrls);

            if (generalConfig.websiteShareUrls) {
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
                if (data.meta.length) {
                    this.handleMetaItems(data.meta);
                }
            }
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
            shortUrlCn(metaInfo.url).then(url => {
                return ResultHelper.createCopy({
                    url, title: 'Short URL', icon: metaInfo.icon, showDesc: true, desc: url
                });
            }).then(item => this.urls.push(item));
        }
    }

    generateShareUrls() {
        const shareInfo = this.pageMeta.share || this.pageMeta;

        generateSocialUrls(shareInfo).then(links => {
            this.shareUrls = links.map(item => {
                let icon;

                if (item.class.startsWith('http')) {
                    icon = item.class;
                } else {
                    icon = chrome.extension.getURL(`img/share-icons/${item.class}.jpg`);
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

    handleMetaItems(meta) {
        meta.forEach(item => {
            item.icon = this.icon;
            item.universal = true;
        });

        this.meta = meta.filter(item => item.desc || item.url);
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
                custom: true
            }
        };

        const first = text[0];

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
        } else {
            return Promise.resolve(this.paths.filter(cnNameFilter).map(mapTo('action')));
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

export function createWebsites(parentWindow, theHost, meta, general = {}) {
    return helper.init().then(sites => {
        let mixedSites = sites.filter(site => {
            return theHost.indexOf(site.host) !== -1 && !site.disabled;
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
            const website = websiteList.create({
                ...info
            });

            return website;
        } else {
            return 'no title or host';
        }
    },

    remove(id) {
        const model = websiteList.remove(id);

        websiteList.chromeStorage.destroy(model);

        return model;
    },

    update(attrs) {
        const diary = websiteList.set(attrs, {
            add: false,
            remove: false
        });

        diary.save();

        return diary;
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