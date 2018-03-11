/*global EXT_TYPE _gaq*/
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import './options.scss'
import ga from '../../js/common/ga'
import changelog from '../../js/info/changelog'
import util from '../../js/common/util'
import { helpInfo } from '../../js/info/help'
import CONST from '../../js/constant'
import WebsitesMixin from './mixins/websites'
import AdvancedMixin from './mixins/advanced'
import AppearanceMixin from './mixins/appearance'
import WallpapersMixin from './mixins/wallpapers'
import WorkflowsMixin from './mixins/workflows'
import PluginsMixin from './mixins/plugins'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';

Vue.use(ElementUI);

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
                changelog,
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
            WorkflowsMixin,
            PluginsMixin
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
                    this.loadWorkflowsIfNeeded();
                }
            },
            handleTabClick: function(tab) {
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
            }
        }
    });
}

init();