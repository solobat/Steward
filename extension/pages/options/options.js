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
const getData = field => () => {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({
            action: field
        }, resp => {
            resolve(resp.data);
        });
    });
}
const getConfig = getData('getConfig');
const getWorkflows = getData('getWorkflows');

function init() {
    Promise.all([
        getConfig(),
        getWorkflows()
    ]).then(([config, workflows]) => {
        const tips = CONST.I18N.TIPS;

        config.lastVersion = config.version || version;

        const i18nTexts = getI18nTexts({general: config.general, tips});

        ga();
        render(config, workflows, i18nTexts);
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

function render({general, plugins, lastVersion}, workflows, i18nTexts) {
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
                workflowSearchText: '',
                currentPlugin: null,
                currentWorkflow: null,
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
                workflows,
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
            filteredWorkflows() {
                const text = this.workflowSearchText.toLowerCase();

                return this.workflows.filter(workflow => {
                    return workflow.title.toLowerCase().indexOf(text) > -1;
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
            WallpapersMixin
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
            },

            handleNewWorkflowClick() {
                const maxNum = CONST.NUMBER.MAX_WORKFLOW_NUM;

                if (this.workflows.length < maxNum) {
                    this.currentWorkflow = {
                        title: 'New Workflow',
                        desc: '',
                        content: ''
                    };
                } else {
                    this.$message.warning(`You can not create more than ${maxNum} workflows`);
                }
            },

            handleWorkflowClick(workflow) {
                this.currentWorkflow = workflow;
                _gaq.push(['_trackEvent', 'options_workflows', 'click', workflow.title]);
            },

            reloadWorkflows() {
                getWorkflows().then(results => {
                    this.workflows = results;
                });
            },

            handleWorkflowsSubmit() {
                const { title, content, id } = this.currentWorkflow;

                if (title && content) {
                    if (id) {
                        chrome.runtime.sendMessage({
                            action: 'updateWorkflow',
                            data: this.currentWorkflow
                        }, () => {
                            this.reloadWorkflows();
                            this.$message('Update workflow successfully');
                        });
                    } else {
                        chrome.runtime.sendMessage({
                            action: 'createWorkflow',
                            data: this.currentWorkflow
                        }, resp => {
                            this.reloadWorkflows();
                            this.currentWorkflow = resp.data;
                            this.$message('Create workflow successfully');
                        });
                    }
                } else {
                    this.$message.warning('Title and content are required!');
                }
            },

            deleteWorkflow(workflow) {
                if (workflow && workflow.id) {
                    return new Promise(resolve => {
                        chrome.runtime.sendMessage({
                            action: 'removeWorkflow',
                            data: workflow.id
                        }, resp => {
                            console.log(resp);
                            resolve(resp);
                        });
                    });
                } else {
                    return Promise.reject('no workflow to delete');
                }
            },

            handleWorkflowsDelete() {
                this.$confirm('This operation will permanently delete the workflow, whether to continue?', 'Prompt', {
                        confirmButtonText: 'Delete',
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }).then(() => {
                        this.deleteWorkflow(this.currentWorkflow).then(() => {
                            this.currentWorkflow = null;
                            this.reloadWorkflows();
                        }).catch(resp => {
                            this.$message.error(resp);
                        });
                    }).catch(() => {

                    });
            }
        }
    });
}

init();