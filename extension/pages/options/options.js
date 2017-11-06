/*global EXT_TYPE _gaq*/
import $ from 'jquery'
import Vue from 'vue'
import _ from 'underscore'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './options.scss'
import ga from '../../js/common/ga'
import { plugins as pluginList } from '../../js/plugins/plugins'
import changelog from '../../js/info/changelog'
import storage from '../../js/utils/storage'
import util from '../../js/common/util'
import { aboutus } from '../../js/info/about'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';

Vue.use(ElementUI)

const pluginModules = _.sortBy(pluginList.filter(item => item.commands), 'name').map(plugin => {
    const {name, icon, commands, title} = plugin;

    return {
        name,
        version: plugin.version,
        commands,
        title,
        icon
    }
});
let config;

// plugins: { [pname]: { version, commands } }
function init() {
    chrome.storage.sync.get('config', function(res) {
        if (res.config) {
            config = res.config;
        } else {
            config = {};
        }
        console.log(config);

        let plugins = {};
        const general = {
            cacheLastCmd: true,
            defaultPlugin: ''
        };

        if (config.general) {
            $.extend(general, config.general);
        }

        if (config.plugins) {
            plugins = config.plugins;
        }

        // 总是确保数据是最新的
        pluginModules.forEach(plugin => {
            mergePluginData(plugin, plugins);
        });

        const results = {
            general,
            plugins,
            lastVersion: config.version || version
        };

        const i18nTexts = getI18nTexts({general});

        ga();
        render(results, i18nTexts);
    });
}

function getI18nTexts(obj) {
    const texts = {};

    try {
        let cate;
        for (cate in obj) {
            const subobj = texts[cate] = {};

            let key;
            for (key in obj[cate]) {
                subobj[key] = chrome.i18n.getMessage(`${cate}_${key}`);
            }
        }
    } catch (e) {
        console.log(e);
    }

    return texts;
}

function mergePluginData(plugin, plugins) {
    const pname = plugin.name;
    const cachePlugin = plugins[pname];

    if (!cachePlugin) {
        plugins[pname] = {
            version: plugin.version,
            commands: plugin.commands
        };
    } else {
        if (!cachePlugin.version) {
            cachePlugin.version = 1;
        }

        if (plugin.version > cachePlugin.version) {
            // rough merge
            cachePlugin.commands = $.extend(true, plugin.commands, cachePlugin.commands);
            cachePlugin.version = plugin.version;
        }
    }
}

const appearanceItems = [{
    name: 'wallpapers',
    icon: '/img/wallpaper-icon.png'
}, {
    name: 'themes',
    icon: '/img/themes-icon.png'
}];
const defaultPlugins = ['Top Sites', 'Bookmarks', 'Tabs', 'Weather'].map(name => {
    return {
        label: name,
        value: name
    }
});

function render({general, plugins, lastVersion}, i18nTexts) {
    let activeName = 'general';

    if (EXT_TYPE === 'alfred') {
        activeName = 'plugins';
    }

    if (lastVersion < version) {
        activeName = 'update';
    }

    const fromTab = util.getParameterByName('tab');

    if (fromTab) {
        activeName = fromTab.toLowerCase();
    }

    new Vue({
        el: '#app',
        data: function() {
            return {
                activeName,
                pluginSearchText: '',
                currentPlugin: null,
                curApprItem: null,
                appearanceItems,
                wallpapers: [],
                selectedWallpaper: window.localStorage.getItem('wallpaper') || '',
                changelog,
                defaultPlugins,
                extType,
                storeId,
                aboutus,
                config: {
                    general,
                    plugins,
                    version
                },
                i18nTexts
            }
        },
        computed: {
            filteredPlugins: function() {
                const text = this.pluginSearchText.toLowerCase();

                return pluginModules.filter(plugin => {
                    return plugin.name.toLowerCase().indexOf(text) > -1;
                });
            }
        },
        mounted: function() {
            if (activeName === 'update') {
                this.$nextTick(() => {
                    this.saveConfig(true);
                });
            }
        },
        methods: {
            handleClick: function(tab) {
                _gaq.push(['_trackEvent', 'options_tab', 'click', tab.name]);
            },

            saveConfig: function(silent) {
                const that = this;
                const newConfig = JSON.parse(JSON.stringify(this.config));

                chrome.storage.sync.set({
                    config: newConfig
                }, function() {
                    if (silent) {
                        console.log('save successfully');
                    } else {
                        that.$message('save successfully!');
                    }
                });
            },

            handleGeneralSubmit: function() {
                this.saveConfig();

                _gaq.push(['_trackEvent', 'options_general', 'save']);
            },

            handlePluginClick: function(plugin) {
                this.currentPlugin = plugin;
                _gaq.push(['_trackEvent', 'options_plugins', 'click', plugin.name]);
            },

            handlePluginsSubmit: function() {
                this.saveConfig();

                _gaq.push(['_trackEvent', 'options_plugins', 'save', this.currentPlugin.name]);
            },

            handleApprItemClick: function(apprItem) {
                this.curApprItem = apprItem;

                switch (apprItem.name) {
                    case 'wallpapers':
                        this.loadWallpapersIfNeeded();
                        break;
                    default:
                        break;
                }

                _gaq.push(['_trackEvent', 'options_appearance', 'click', apprItem.name]);
            },

            loadWallpapersIfNeeded: function() {
                if (!this.wallpapers.length) {
                    storage.sync.get('wallpapers').then(wallpapers => {
                        this.wallpapers = wallpapers;
                    });
                }
            },

            chooseWallpaper: function(wallpaper) {
                if (this.selectedWallpaper === wallpaper) {
                    this.selectedWallpaper = '';
                    window.localStorage.removeItem('wallpaper');
                } else {
                    this.selectedWallpaper = wallpaper;
                    window.localStorage.setItem('wallpaper', wallpaper);
                }
                _gaq.push(['_trackEvent', 'options_wallpaper', 'click', 'choose']);

                this.$message('set successfully!');
            },

            handleWallpaperDownload: function() {
                _gaq.push(['_trackEvent', 'options_wallpaper', 'click', 'download']);
            },

            confirmDeleteWallpaper: function(wallpaper) {
                this.$confirm('This operation will permanently delete the wallpaper, whether to continue?',
                    'Prompt', {
                    confirmButtonText: 'Delete',
                    cancelButtonText: 'Cancel',
                    type: 'warning'
                }).then(() => {
                    this.deleteWallpaper(wallpaper);
                }).catch(() => {

                });
            },

            deleteWallpaper: function(wallpaper) {
                const wpIdx = this.wallpapers.indexOf(wallpaper);

                if (wpIdx !== -1) {
                    this.wallpapers.splice(wpIdx, 1);
                }

                storage.sync.set({
                    wallpapers: this.wallpapers
                }).then(() => {
                    this.$message({
                        type: 'success',
                        message: 'delete successfully!'
                    });
                    _gaq.push(['_trackEvent', 'options_wallpaper', 'click', 'delete']);
                });
            }
        }
    });
}

init();