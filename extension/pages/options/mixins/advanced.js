import { restoreConfig } from '../../../js/common/config'
import { backup, restoreData } from '../../../js/helper'
import { getNetworks, saveNetworks } from '../../../lib/social-share-urls'

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
            }
        };
    },
    methods: {
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
                        this.$message.error('File content is wrong');

                        return Promise.reject('File content is wrong');
                    }

                    return restoreData(data, this.config);
                }).then(resp => {
                    console.log(resp);
                    this.$message.success('Import successfully and this page will be reloaded!');
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }).catch(msg => {
                    console.log(msg);
                    this.$message.error('Failed to import data! This may be due to corrupted or incorrect data files.');
                });
            } else {
                this.$message.error('Incorrect file type!');
            }

            return false;
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
        },

        networksIconFormatter(row, column) {
            const icon = row[column.property];

            if (icon.startsWith('http')) {
                return icon;
            } else {
                return chrome.extension.getURL(`img/share-icons/${icon}.jpg`);
            }
        },

        saveNetworks() {
            return saveNetworks(JSON.parse(JSON.stringify(this.socialNetworks))).then(resp => {
                this.$message.success('Save successfully!');
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
                    this.$message.error('Please check the form');
                } else {
                    this.submitNetwork();
                }
            });
        }
    }
}