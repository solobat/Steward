/*global EXT_TYPE */
import { restoreConfig } from '../../../js/common/config'
import { dataHelpers } from '../../../js/helper'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';

function downloadAsJson(exportObj, exportName) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj))}`;
    const downloadAnchorNode = document.createElement('a');

    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${exportName}.json`);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

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
    });
}

function restoreData(data) {
    console.log(data);
    const tasks = dataHelpers.map(helper => {
        const obj = data[helper.key];

        if (obj) {
            return helper.setData(obj);
        } else {
            return Promise.resolve(null);
        }
    });

    return Promise.all(tasks);
}

export default {
    methods: {
        backup() {
            const tasks = dataHelpers.map(helper => helper.getData());

            Promise.all(tasks).then(([config, workflows, websites, wallpapers, themes]) => {
                const data = {
                    config,
                    workflows,
                    websites,
                    wallpapers,
                    themes,
                    meta: {
                        version,
                        export_at: Number(new Date()),
                        app: extType
                    }
                };

                console.log(data);
                downloadAsJson(data, 'Steward-Backup');
            });
        },

        handleExportClick() {
            this.backup();
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

                    return restoreData(data);
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
         }
    }
}