import util from '../common/util'
import { WebsiteList } from '../collection/website'

const websiteList = new WebsiteList();

export const filterByName = (suggestions, text) => util.getMatches(suggestions, text, 'name');
export const filterByPath = (suggestions, text) => util.getMatches(suggestions, text, 'path');

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
    constructor(options, parentWindow) {
        this.name = options.name;
        this.type = 'search';
        this.icon = options.icon;
        this.host = options.host;
        this.parentWindow = parentWindow;
        this.navs = options.navs || 'nav ul li a';
        this.outlineScope = options.outlineScope || '';
        this.paths = [];
        this.customPaths = handlePaths(options.paths, options.deps) || [];
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('message', event => {
            const { data } = event;

            if (data.action === 'navs') {
                if (event.data.navs.length) {
                    this.paths = this.customPaths.concat(event.data.navs);
                    console.log(this.paths);
                } else {
                    this.paths = this.customPaths;
                }
            } else if (data.action === 'outline') {
                if (data.outline.length) {
                    this.outline = data.outline;
                }
            } else if (data.action === 'show') {
                this.handleBoxShow();
            }
        });
    }

    handleBoxShow() {
        this.findNavs();
        this.genOutline();
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

    onInput(text) {
        const cnNameFilter = item => util.matchText(text, item.name + item.path);
        const outlineNameFilter = item => util.matchText(text.slice(1), item.name);
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

        if (text[0] === '/') {
            if (text === '/') {
                return Promise.resolve(this.paths.map(mapTo('action')));
            } else {
                return Promise.resolve(filterByPath(this.paths, text).map(mapTo('action')));
            }
        } else if (text[0] === '`') {
            return Promise.resolve(this.outline.filter(outlineNameFilter).map(mapTo('action', 'outline')));
        } else {
            return Promise.resolve(this.paths.filter(cnNameFilter).map(mapTo('action')));
        }
    }
}

export function createWebsites(parentWindow, theHost) {
    return helper.init().then(sites => {
        return sites.filter(site => {
            return theHost.indexOf(site.host) !== -1 && !site.disabled;
        }).map(site => {
            return new Website(site, parentWindow);
        });
    });
}

const helper = {
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

    init() {
        return this.refresh().then(() => {
            const list = this.getWebsiteList();

            return list;
        });
    }
}

export default helper