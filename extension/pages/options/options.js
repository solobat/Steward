import $ from 'jquery'
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './options.css'
import ga from '../../js/common/ga'
import { plugins as pluginList } from '../../js/plugins/plugins'
import changelog from '../../js/info/changelog'
import storage from '../../js/utils/storage'

var manifest = chrome.runtime.getManifest();
const version = manifest.version;

Vue.use(ElementUI)

let pluginModules = pluginList.map(plugin => {
    let {name, icon, commands, title, version} = plugin;

    return {
        name,
        version,
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
        let general = {
            cacheLastCmd: true
        };

        if (config.general) {
            general = config.general;
        }

        if (config.plugins) {
            plugins = config.plugins;
        }

        // 总是确保数据是最新的
        pluginModules.forEach(plugin => {
            mergePluginData(plugin, plugins);
        });

        let results = {
            general,
            plugins,
            lastVersion: config.version || version
        };

        let i18nTexts = getI18nTexts({general});

        ga();
        render(results, i18nTexts);
    });
}

function getI18nTexts(obj) {
    let texts = {};

    try {
        for (let cate in obj) {
            let subobj = texts[cate] = {};

            for (var key in obj[cate]) {
                subobj[key] = chrome.i18n.getMessage(`${cate}_${key}`);
            }
        }
    } catch (e) {
        console.log(e);
    }

    return texts;
}

function mergePluginData(plugin, plugins) {
    let pname = plugin.name;
    let cachePlugin = plugins[pname];
    let version = plugin.version;

    if (!cachePlugin) {
        plugins[pname] = {
            version,
            commands: plugin.commands
        };
    } else {
        if (!cachePlugin.version) {
            cachePlugin.version = 1;
        }

        if (version > cachePlugin.version) {
            // rough merge
            cachePlugin.commands = $.extend(true, plugin.commands, cachePlugin.commands);
            cachePlugin.version = version;
        }
    }
}

const panelKeys = ['general', 'plugins'];
const appearanceItems = [{
    name: 'wallpapers',
    icon: '/img/wallpaper-icon.png'
}, {
    name: 'themes',
    icon: '/img/themes-icon.png'
}];
function render({general, plugins, lastVersion}, i18nTexts) {
    let activeName = 'general';

    if (lastVersion < version) {
        activeName = 'update';
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
                let text = this.pluginSearchText.toLowerCase();

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
                let self = this;
                let newConfig = JSON.parse(JSON.stringify(this.config));

                chrome.storage.sync.set({
                    config: newConfig
                }, function() {
                    if (silent) {
                        console.log('save successfully');
                    } else {
                        self.$message('save successfully!');
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
                    storage.sync.get('wallpapers').then(wallpapers => this.wallpapers = wallpapers);
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
                let wpIdx = this.wallpapers.indexOf(wallpaper);

                if (wpIdx !== -1) {
                    this.wallpapers.splice(wpIdx, 1);
                }

                storage.sync.set({
                    wallpapers: this.wallpapers
                }).then(resp => {
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