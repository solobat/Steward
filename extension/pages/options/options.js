/*global EXT_TYPE _gaq*/
import Vue from 'vue'
import _ from 'underscore'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './options.scss'
import ga from '../../js/common/ga'
import { plugins as pluginList } from '../../js/plugins/browser'
import changelog from '../../js/info/changelog'
import util from '../../js/common/util'
import { helpInfo } from '../../js/info/help'
import CONST from '../../js/constant'
import WebsitesMixin from './mixins/websites'
import AdvancedMixin from './mixins/advanced'
import AppearanceMixin from './mixins/appearance'
import WallpapersMixin from './mixins/wallpapers'
import WorkflowsMixin from './mixins/workflows'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';

Vue.use(ElementUI);

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

const getConfig = util.getData('getConfig');

function init() {
    Promise.all([
        getConfig()
    ]).then(([config]) => {
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
                changelog,
                defaultPlugins: CONST.OPTIONS.DEFAULT_PLUGINS,
                extType,
                storeId,
                helpInfo,
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
            },

            hasKeywordCommands() {
                if (this.currentPlugin && this.currentPlugin.commands) {
                    return this.currentPlugin.commands.filter(cmd => cmd.type === 'keyword').length > 0;
                } else {
                    return false;
                }
            }
        },

        mounted: function() {
            if (activeName === 'update') {
                this.$nextTick(() => {
                    this.saveConfig(true);
                });
            }
            this.initTab(this.activeName);
        },

        mixins: [
            WebsitesMixin,
            AdvancedMixin,
            AppearanceMixin,
            WallpapersMixin,
            WorkflowsMixin
        ],

        methods: {
            initTab(tabname) {
                if (tabname === 'wallpapers') {
                    this.loadWallpapersIfNeeded();
                } else if (tabname === 'appearance') {
                    if (!this.curApprItem) {
                        this.loadThemes().then(() => {
                            this.updateApprItem(this.appearanceItems[0]);
                        });
                    } else {
                        this.applyTheme(this.themeMode);
                    }
                } else if (tabname === 'workflows') {
                    this.loadWallpapersIfNeeded();
                }
            },
            handleClick: function(tab) {
                this.initTab(tab.name);
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

            getDocumentURL: function(plugin) {
                return util.getDocumentURL(plugin.name);
            },

            handlePluginClick: function(plugin) {
                this.currentPlugin = plugin;
                _gaq.push(['_trackEvent', 'options_plugins', 'click', plugin.name]);
            },

            checkTriggerRepetition() {
                const curName = this.currentPlugin.name;
                const allplugins = this.config.plugins;
                const triggers = allplugins[curName].commands.map(item => item.key);
                const info = [];

                for (const name in allplugins) {
                    const plugin = allplugins[name];

                    if (plugin.commands && name !== curName) {
                        plugin.commands.forEach(({ key }) => {
                            if (triggers.indexOf(key) !== -1) {
                                info.push({
                                    name,
                                    trigger: key
                                });
                            }
                        });
                    }
                }

                return info;
            },

            handlePluginsSubmit: function() {
                const checkInfo = this.checkTriggerRepetition();
                const tipsFn = ({ trigger, name }) => `「${trigger}」-- plugin 「${name}」`;

                if (checkInfo.length > 0) {
                    this.$message.warning(`trigger conflict: ${checkInfo.map(tipsFn).join('; ')}`);
                } else {
                    this.saveConfig();

                    _gaq.push(['_trackEvent', 'options_plugins', 'save', this.currentPlugin.name]);
                }
            }
        }
    });
}

init();