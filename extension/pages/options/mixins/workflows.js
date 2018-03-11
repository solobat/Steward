/*global _gaq*/
import CONST from '../../../js/constant'
import util from '../../../js/common/util'

const getWorkflows = util.getData('getWorkflows');

export default {
    data() {
        return {
            workflowSearchText: '',
            currentWorkflow: null,
            workflowLoaded: false,
            workflows: []
        };
    },

    computed: {
        filteredWorkflows() {
            const text = this.workflowSearchText.toLowerCase();

            return this.workflows.filter(workflow => {
                return workflow.title.toLowerCase().indexOf(text) > -1;
            });
        }
    },

    methods: {
        loadWorkflowsIfNeeded: function() {
            if (!this.workflowLoaded) {
                getWorkflows().then(workflows => {
                    this.workflows = workflows;
                    this.workflowLoaded = true;
                });
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
}