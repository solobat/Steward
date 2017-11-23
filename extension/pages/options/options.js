/*global EXT_TYPE _gaq*/
import Vue from 'vue'
import _ from 'underscore'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './options.scss'
import ga from '../../js/common/ga'
import { plugins as pluginList } from '../../js/plugins/browser'
import changelog from '../../js/info/changelog'
import storage from '../../js/utils/storage'
import util from '../../js/common/util'
import { aboutus } from '../../js/info/about'
import { helpInfo } from '../../js/info/help'
import CONST from '../../js/constant'
import { restoreConfig } from '../../js/common/config'

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

// plugins: { [pname]: { version, commands } }
function init() {
    chrome.storage.sync.get(CONST.STORAGE.CONFIG, function(res) {
        const config = res.config;
        const tips = CONST.I18N.TIPS;

        config.lastVersion = config.version || version;

        const i18nTexts = getI18nTexts({general: config.general, tips});

        ga();
        render(config, i18nTexts);
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

function render({general, plugins, lastVersion}, i18nTexts) {
    let activeName = 'general';

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
                appearanceItems: CONST.OPTIONS.APPEARANCE_ITEMS,
                wallpapers: [],
                selectedWallpaper: window.localStorage.getItem(CONST.STORAGE.WALLPAPER) || '',
                changelog,
                defaultPlugins: CONST.OPTIONS.DEFAULT_PLUGINS,
                extType,
                storeId,
                helpInfo,
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
                    [CONST.STORAGE.CONFIG]: newConfig
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
                    storage.sync.get(CONST.STORAGE.WALLPAPERS).then(wallpapers => {
                        this.wallpapers = wallpapers;
                    });
                }
            },

            chooseWallpaper: function(wallpaper) {
                const KEY = CONST.STORAGE.WALLPAPER;

                if (this.selectedWallpaper === wallpaper) {
                    this.selectedWallpaper = '';
                    window.localStorage.removeItem(KEY);
                } else {
                    this.selectedWallpaper = wallpaper;
                    window.localStorage.setItem(KEY, wallpaper);
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
            },

            handleResetClick() {
               this.$confirm('This operation will reset your config, whether to continue?',
                    'Prompt', {
                    type: 'warning'
                }).then(() => {
                    restoreConfig().then(() => {
                        this.$message('Reset successfully and this page will be reloaded');
                        setTimeout(function() {
                            window.location.reload();
                        }, 500);
                    });
                }).catch(() => {
                });
            }
        }
    });
}

init();