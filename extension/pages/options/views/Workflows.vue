<template>
  <div>
    <el-row>
      <el-col :span="5">
        <div class="grid-content plugin-list">
          <div class="plugin-searchbar">
            <el-input placeholder="Search" icon="search" v-model="workflowSearchText"></el-input>
          </div>
          <div class="button-bar">
            <el-button
              type="primary"
              icon="plus"
              @click="handleNewWorkflowClick"
            >{{i18nTexts.ui.settings.actions.newworkflow}}</el-button>
          </div>
          <div
            class="plugin-item workflow-item"
            :class="{'is-selected': workflow === currentWorkflow}"
            v-for="(workflow, index) in filteredWorkflows"
            :key="index"
            @click="handleWorkflowClick(workflow)"
          >
            <span class="plugin-name">{{workflow.title}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="19">
        <div class="grid-content bg-black plugin-editor">
          <div v-if="currentWorkflow" class="plugin-editor-container">
            <div class="plugin-editor-header">
              <div class="plugin-editor-text">
                <p
                  class="plugin-editor-title"
                >{{i18nTexts.ui.settings.notion.workflow}} - {{currentWorkflow.title}}</p>
              </div>
            </div>
            <div class="plugin-editor-config">
              <el-form
                style="margin: 20px;padding: 12px; min-height: 150px;"
                ref="form"
                :model="currentWorkflow"
                label-width="200px"
              >
                <el-form-item :label="i18nTexts.ui.settings.fields.title">
                  <el-input type="text" style="width: 300px;" v-model="currentWorkflow.title"></el-input>
                </el-form-item>
                <el-form-item :label="i18nTexts.ui.settings.fields.description">
                  <el-input type="text" style="width: 300px;" v-model="currentWorkflow.desc"></el-input>
                </el-form-item>
                <el-form-item :label="i18nTexts.ui.settings.fields.content">
                  <el-input
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    type="textarea"
                    style="width: 300px;"
                    :autosize="{ minRows: 5, maxRows: 12 }"
                    placeholder="Please input your commands"
                    v-model="currentWorkflow.content"
                  ></el-input>
                  <el-tooltip
                    class="item"
                    effect="dark"
                    content="Workflow Documentation"
                    placement="top-start"
                  >
                    <a href="http://oksteward.com/steward-documents/Workflows.html" target="_blank">
                      <i class="el-icon-document"></i>
                    </a>
                  </el-tooltip>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click.native.prevent="handleWorkflowsSubmit"
                  >{{i18nTexts.ui.settings.actions.save}}</el-button>
                  <el-button
                    v-if="currentWorkflow.id"
                    type="warning"
                    @click.native.prevent="handleWorkflowsDelete"
                  >{{i18nTexts.ui.settings.actions.delete}}</el-button>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import CONST from "constant";
import util from "common/util";

const getWorkflows = util.getData("getWorkflows");

export default {
  name: 'Workflows',
  props: ["config", "i18nTexts"],

  data() {
    return {
      workflowSearchText: "",
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
          title: "New Workflow",
          desc: "",
          content: ""
        };
      } else {
        this.$message.warning(
          `You can not create more than ${maxNum} workflows`
        );
      }
    },

    handleWorkflowClick(workflow) {
      this.currentWorkflow = workflow;
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
          chrome.runtime.sendMessage(
            {
              action: "updateWorkflow",
              data: this.currentWorkflow
            },
            () => {
              this.reloadWorkflows();
              this.$message(chrome.i18n.getMessage("save_ok"));
            }
          );
        } else {
          chrome.runtime.sendMessage(
            {
              action: "createWorkflow",
              data: this.currentWorkflow
            },
            resp => {
              this.reloadWorkflows();
              this.currentWorkflow = resp.data;
              this.$message(chrome.i18n.getMessage("add_ok"));
            }
          );
        }
      } else {
        this.$message.warning("Title and content are required!");
      }
    },

    deleteWorkflow(workflow) {
      if (workflow && workflow.id) {
        return new Promise(resolve => {
          chrome.runtime.sendMessage(
            {
              action: "removeWorkflow",
              data: workflow.id
            },
            resp => {
              console.log(resp);
              resolve(resp);
            }
          );
        });
      } else {
        return Promise.reject("no workflow to delete");
      }
    },

    handleWorkflowsDelete() {
      this.$confirm(
        util.getTextMsg("confirm_delete_tpl", "settings_notion_workflow"),
        "Confirm",
        {
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          this.deleteWorkflow(this.currentWorkflow)
            .then(() => {
              this.currentWorkflow = null;
              this.reloadWorkflows();
            })
            .catch(resp => {
              this.$message.error(resp);
            });
        })
        .catch(() => {});
    }
  },
  mounted() {
    this.loadWorkflowsIfNeeded();
  }
};
</script>

<style>
</style>
