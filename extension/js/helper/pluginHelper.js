/**
 * @desc pluginHelper
 */

import util from '../common/util'
import $ from 'jquery'
import dayjs from 'dayjs'
import constant from '../constant'
import { CustomPlugin as CustomPluginModel, CustomPluginList } from '../collection/plugin'
import axios from 'axios'
import storage from '../utils/storage'
import browser from 'webextension-polyfill'

const blockPageUrl = chrome.extension.getURL('urlblock.html');

function PluginHelper() {
    this.mode = '';
    this.original = '';
}

PluginHelper.prototype = {
    constructor: PluginHelper,

    tryMatchBlockPage(url) {
        return url.split('urlblock.html');
    },

    prepare() {
        const match = this.tryMatchBlockPage(window.location.href);

        if (match[1]) {
            this.mode = 'blocked';
            this.original = match[1];
        } else {
            this.mode = 'unblocked';
        }
    },

    block() {
        const url = window.location.href;

        window.history.pushState({}, document.title, url);
        window.location.href = `${blockPageUrl}?original=${url}`
    },

    unblock() {
        window.history.back();
    },

    checkBlock(blockedUrls) {
        if (this.mode === 'unblocked') {
            const url = window.location.href;
            const index = blockedUrls.findIndex(item => url.indexOf(item.title) !== -1);

            if (index !== -1) {
                this.block();
            }
        } else {
            const url = this.original;
            const index = blockedUrls.findIndex(item => url.indexOf(item.title) !== -1);

            if (index === -1) {
                this.unblock();
            }
        }
    },

    bindEvents() {
        chrome.storage.onChanged.addListener(changes => {
            if (changes.url) {
                this.checkBlock(changes.url.newValue);
            }
        });
    },

    init(blockedUrls) {
        this.prepare();
        this.bindEvents();
        this.checkBlock(blockedUrls);
    }
}

export default PluginHelper


class Plugin {
    constructor(options = {}) {
        this.errors = [];
        this.commands = [];
        this.init(options);
    }

    init(options) {
        const { source } = options;

        if (source) {
            if (options.id) {
                this._id = options.id;
            }
            this.parse(source);
        } else {
            this.valid = true;
        }
    }

    onInit() { }

    onInput() { }

    onEnter() { }

    onNotice() { }

    onLeave() { }

    createContext() {
        return {
            app: window.stewardApp,
            chrome: chrome,
            util,
            dayjs,
            $,
            axios,
            constant,
            storage,
            browser
        }
    }

    mergeMeta(meta) {
        const { author, version, name, category, icon, title, commands,
             onInit, onInput, onEnter, onLeave, onNotice, type } = meta;
        // plugin's unique id
        const uid = `${author}/${name}`;

        Object.assign(this, {
            uid, version, name, category, icon, title, commands, 
            onInit, onInput, onEnter, onLeave, onNotice, author, type
        });
    }

    getMeta() {
        const { uid, version, name, category, icon, title, commands, source, author } = this;

        return {
            uid, version, name, category, icon, title, commands, source, author
        };
    }

    validate() {
        const errors = this.errors = [];

        if (!this.author) {
            errors.push('Author property is required');
        }
    }

    parse(source) {
        const context = this.createContext();

        try {
            const pluginModule = { exports: null };
            const fn = new Function('module', source);

            fn(pluginModule);

            if (pluginModule.exports) {
                const meta = pluginModule.exports(context);

                this.source = source;
                this.mergeMeta(meta);
                this.validate();
            } else {
                throw new Error('module.exports is null');
            }
        } catch (error) {
            this.errors.push('parse error');
            console.log(error);
        } finally {
            this.valid = this.errors.length === 0;
        }
    }
}

export function pluginFactory(options) {
    const plugin = new Plugin(options);

    if (plugin.valid) {
        pluginFactory.errors = [];

        return plugin;
    } else {
        pluginFactory.errors = plugin.errors.slice(0);

        return null;
    }
}

export function getCustomPlugins() {
    return customPluginHelper.init().then((list = []) => {
        return list.map(item => {
            return pluginFactory(item);
        }).filter(item => item !== null);
    });
}

const customPluginList = new CustomPluginList();

export const customPluginHelper = {
    create(info) {
        if (info.uid && info.source) {
            const plugin = new CustomPluginModel();

            plugin.set(info);

            return Promise.resolve(customPluginList.chromeStorage.create(plugin).then(() => {
                return this.refresh().then(() => {
                    return plugin;
                });
            }));
        } else {
            return Promise.reject('no id or source');
        }
    },

    remove(id) {
        const model = customPluginList.remove(id);

        return Promise.resolve(customPluginList.chromeStorage.destroy(model).then(() => {
            return this.refresh();
        }));
    },

    checkPluginStatus(plugin) {
        let uid = plugin.uid;

        if (!uid) {
            uid = `${plugin.author}/${plugin.name}`;
        }

        const result = this.getCustomPluginList().find(item => {
            return item.uid === uid;
        });

        if (result) {
            if (plugin.version > result.version) {
                plugin.id = result.id;

                return constant.BASE.PLUGIN_STATUS.NEWVESION;
            } else {
                return constant.BASE.PLUGIN_STATUS.INSTALLED;
            }
        } else {
            return constant.BASE.PLUGIN_STATUS.NOTINSTALL;
        }
    },

    update(attrs) {
        const plugin = customPluginList.set(attrs, {
            add: false,
            remove: false
        });

        return Promise.resolve(plugin.save().then(() => {
            return plugin;
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
            customPluginList.fetch().done(resp => {
                resolve(resp);
            }).fail(resp => {
                reject(resp);
            });
        });
    },

    getCustomPluginList() {
        return customPluginList.toJSON();
    },

    init() {
        return this.refresh().then(() => {
            const list = this.getCustomPluginList();

            return list;
        });
    }
}
