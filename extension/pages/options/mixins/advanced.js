import { restoreConfig } from '../../../js/common/config'
import { backup, restoreData } from '../../../js/helper'
import { getNetworks, saveNetworks } from '../../../lib/social-share-urls'
import { codemirror } from 'vue-codemirror'
import 'codemirror/keymap/vim.js'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/fold/foldcode.js'
import 'codemirror/addon/fold/foldgutter.js'
import 'codemirror/addon/fold/brace-fold.js'
import 'codemirror/addon/fold/comment-fold.js'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'
import { PLUGIN_DEFAULT } from '../../../js/constant/code'
import { customPluginHelper, pluginFactory } from '../../../js/helper/pluginHelper'

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function(event) {
            resolve(event.target.result);
        };

        reader.onerror = function(event) {
            reject(`File could not be read! Code ${event.target.error.code}`);
        };

        reader.readAsText(file);
    })
}

export default {
    data() {
        return {
            activeAdvancedName: ['userData'],
            socialNetworks: [],
            advancedLoaded: false,
            networkDialogVisible: false,
            currentNetwork: null,
            networkForm: {
                name: '',
                class: '',
                url: '',
                enable: true
            },
            networkRules: {
                name: [{ type: 'string', required: true, trigger: 'change' }],
                class: [{ type: 'string', required: true, trigger: 'change' }],
                url: [{ type: 'string', required: true, trigger: 'change' }]
            },
            customPlugins: [],
            currentCustomPlugin: null,
            cmOptions: {
                tabSize: 2,
                styleActiveLine: true,
                autoCloseBrackets: true,
                styleSelectedText: true,
                matchBrackets: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                keyMap: 'vim',
                mode: 'text/javascript',
                theme: 'monokai',
                lineNumbers: true,
                line: true
            }
        };
    },

    created() {
        this.fetchCustomPlugins();
    },

    methods: {
        fetchCustomPlugins() {
            customPluginHelper.refresh().then(resp => {
                console.log(resp);
                this.customPlugins = resp || [];
            });
        },

        initAdvancedIfNeeded() {
            if (!this.advancedLoaded) {
                Promise.all([getNetworks()]).then(([networks]) => {
                    this.socialNetworks = networks;
                    this.advancedLoaded = true;
                });
            }
        },

        handleExportClick() {
            backup();
        },

        handleBackupBeforeUpload(file) {
            if (file.type === 'application/json') {
                readFile(file).then(content => {
                    let data;

                    try {
                        data = JSON.parse(content);
                    } catch (error) {
                        this.$message.error(chrome.i18n.getMessage('file_content_error'));

                        return Promise.reject('File content is wrong');
                    }

                    return restoreData(data, this.config);
                }).then(resp => {
                    console.log(resp);
                    this.$message.success(chrome.i18n.getMessage('import_config_ok'));
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }).catch(msg => {
                    console.log(msg);
                    this.$message.error(chrome.i18n.getMessage('import_config_failed'));
                });
            } else {
                this.$message.error(chrome.i18n.getMessage('file_type_wrong'));
            }

            return false;
        },

        handleResetClick() {
            this.$confirm(chrome.i18n.getMessage('reset_config_confirm'),
                 'Prompt', {
                 type: 'warning'
             }).then(() => {
                 restoreConfig().then(() => {
                     this.$message(chrome.i18n.getMessage('reset_config_ok'));
                     setTimeout(function() {
                         window.location.reload();
                     }, 500);
                 });
             }).catch(() => {
             });
        },

        networksIconFormatter(row, column) {
            const icon = row[column.property];

            if (icon.startsWith('http')) {
                return icon;
            } else {
                return chrome.extension.getURL(`iconfont/share-icons/${icon}.svg`);
            }
        },

        saveNetworks() {
            return saveNetworks(JSON.parse(JSON.stringify(this.socialNetworks))).then(resp => {
                this.$message.success(chrome.i18n.getMessage('save_ok'));
            });
        },

        handleNetWorkSwitchChange() {
            this.saveNetworks();
        },

        handleNetworkEditClick(row) {
            this.currentNetwork = row;
            Object.assign(this.networkForm, row);
            this.networkDialogVisible = true;
        },

        handleNetworkDeleteClick(row) {
            this.socialNetworks.splice(this.socialNetworks.indexOf(row), 1);
            this.saveNetworks();
        },

        handleNewNewworkClick() {
            this.networkDialogVisible = true;
        },

        closeNetworkDialog() {
            this.networkForm = {
                name: '',
                class: '',
                url: '',
                enable: true
            };
            this.currentNetwork = null;
            this.networkDialogVisible = false;
        },

        submitNetwork() {
            if (this.currentNetwork) {
                Object.assign(this.currentNetwork, this.networkForm);
            } else {
                this.socialNetworks.push(Object.assign({}, this.networkForm));
            }

            this.closeNetworkDialog();
            this.saveNetworks();
        },

        handleNetworkSaveClick() {
            this.$refs.networkForm.validate(valid => {
                if (!valid) {
                    this.$message.error(chrome.i18n.getMessage('check_form'));
                } else {
                    this.submitNetwork();
                }
            });
        },

        handleCustomPluginClick(plugin) {
            if (plugin) {
                this.currentCustomPlugin = plugin;
            } else {
                this.currentCustomPlugin = {
                    name: '',
                    source: PLUGIN_DEFAULT
                };
            }
        },

        refreshCustomPlugins() {
            this.customPlugins = customPluginHelper.getCustomPluginList();
        },

        updatePlugin(meta) {
            const id = this.currentCustomPlugin.id;
            let result;

            if (id) {
                meta.id = id;
                result = customPluginHelper.update(meta);
            } else {
                result = customPluginHelper.create(meta);
            }

            this.refreshCustomPlugins();
            this.currentCustomPlugin = result.toJSON();
        },

        handleCustomPluginSaveClick() {
            const result = pluginFactory({
                source: this.currentCustomPlugin.source,
                isCustom: true
            });

            if (result) {
                this.updatePlugin(result.getMeta());
                this.$message.success('Save successfully!');
            } else {
                this.$message.error(pluginFactory.errors[0]);
            }
        },

        handleCustomPluginDeleteClick() {
            this.$confirm('This operation will permanently delete the plugin, whether to continue?', 'Prompt', {
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                type: 'warning'
            }).then(() => {
                this.$message('Delete done!');
                customPluginHelper.remove(this.currentCustomPlugin.id);
                this.refreshCustomPlugins();
                this.currentWebsite = null;
            }).catch(() => {

            });
        }
    },

    components: {
        codemirror
    }
}
