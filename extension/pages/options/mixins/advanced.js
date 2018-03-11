import { restoreConfig } from '../../../js/common/config'

export default {
    methods: {
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