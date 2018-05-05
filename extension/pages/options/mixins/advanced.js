import { restoreConfig } from '../../../js/common/config'
import { backup, restoreData } from '../../../js/helper'

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
    methods: {
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
         }
    }
}