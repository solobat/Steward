<template>
  <div>
    <el-collapse v-model="activeAdvancedName">
      <el-collapse-item name="userData" :title="i18nTexts.ui.settings.blocks.exportimport">
        <el-row>
          <el-col :span="2">
            <el-button
              @click="handleExportClick"
              type="primary"
            >{{i18nTexts.ui.settings.actions.export}}</el-button>
          </el-col>
          <el-col :span="2">
            <el-upload accept="text/json" action="/" :before-upload="handleBackupBeforeUpload">
              <el-button type="primary">{{i18nTexts.ui.settings.actions.import}}</el-button>
            </el-upload>
          </el-col>
          <el-col :span="2">
            <el-button
              @click="handleResetClick"
              type="danger"
            >{{i18nTexts.ui.settings.actions.reset}}</el-button>
          </el-col>
        </el-row>
      </el-collapse-item>
      <el-collapse-item name="socialShare" :title="i18nTexts.ui.settings.blocks.socialshareconfig">
        <el-table :data="socialNetworks" style="width: 100%">
          <el-table-column prop="class" label="Icon Link" width="100">
            <template slot-scope="scope">
              <img class="network-icon" :src="networksIconFormatter(scope.row, scope.column)" alt />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="Name" width="180"></el-table-column>
          <el-table-column prop="url" label="URL"></el-table-column>
          <el-table-column label="Operation" width="300">
            <template slot-scope="scope">
              <el-switch v-model="scope.row.enable" @change="handleNetWorkSwitchChange(scope.row)"></el-switch>
              <el-button @click="handleNetworkEditClick(scope.row)" type="primary" icon="edit"></el-button>
              <el-button @click="handleNetworkDeleteClick(scope.row)" type="danger" icon="delete"></el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 12px;">
          <el-button icon="plus" @click="handleNewNewworkClick"></el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item name="textAlias" title="URL Alias">
        <el-input
          type="textarea"
          v-model="textAlias"
          style="width: 800px;"
          placeholder="One line per alias, such as: g https://google.com, "
          autosize
        ></el-input>
        <div class="bts">
          <el-button type="primary" style="margin-top: 15px;" @click="handleTextAliasSaveClick">Save</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item name="actionEditor" title="Action Editor">
        <el-input
          v-if="activeAdvancedName.indexOf('actionEditor') !== -1"
          type="textarea"
          class="editor"
          :rows="10"
          v-model="globalActions"
        />
        <div class="bts">
          <el-button
            type="primary"
            style="margin-top: 15px;"
            @click="handleGlobalActionsSaveClick"
          >Test and Save</el-button>
        </div>
      </el-collapse-item>
      <el-collapse-item name="pluginEditor" :title="i18nTexts.ui.settings.blocks.plugineditor">
        <div class="custom-plugins-container">
          <el-row>
            <el-col :span="6">
              <div class="custom-plugins">
                <div class="button-bar">
                  <el-button type="primary" @click="handleCustomPluginClick()">New Plugin</el-button>
                  <div
                    class="plugin-item workflow-item"
                    :class="{'is-selected': plugin === currentCustomPlugin}"
                    v-for="(plugin, index) in customPlugins"
                    :key="index"
                    @click="handleCustomPluginClick(plugin)"
                  >
                    <span class="plugin-name">{{plugin.name}}</span>
                  </div>
                </div>
                <div class="custom-plugins-inner"></div>
              </div>
            </el-col>
            <el-col :span="18">
              <div class="code-editor" v-if="currentCustomPlugin">
                <el-input
                  class="editor"
                  v-model="currentCustomPlugin.source"
                  type="textarea"
                  :rows="20"
                />
                <div class="bts">
                  <el-button
                    type="primary"
                    style="margin-top: 15px;"
                    @click="handleCustomPluginSaveClick"
                  >Test and Save</el-button>
                  <el-button
                    v-if="currentCustomPlugin.id"
                    type="warning"
                    style="margin-top: 15px;"
                    @click="handleCustomPluginDeleteClick"
                  >Remove</el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>
    </el-collapse>
    <el-dialog v-model="networkDialogVisible" title="Social Network Edit">
      <el-form ref="networkForm" :model="networkForm" :rules="networkRules">
        <el-form-item label="Name" prop="name">
          <el-input v-model="networkForm.name" placeholder="Facebook"></el-input>
        </el-form-item>
        <el-form-item label="Icon" prop="class">
          <el-input v-model="networkForm.class" placeholder="https://xxx.com/favicon.png"></el-input>
        </el-form-item>
        <el-form-item label="URL" prop="url">
          <el-input
            v-model="networkForm.url"
            placeholder="https://www.xxx.com/sharer?url={url}&img={img}&title{title}&desc={desc}"
          ></el-input>
        </el-form-item>
        <div>
          <el-button type="primary" @click="handleNetworkSaveClick">Save</el-button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import { restoreConfig } from "@/js/common/config";
import { backup, restoreData } from "@/js/helper";
import { saveTextAlias, getTextAlias } from "@/js/helper/aliasHelper";
import { getNetworks, saveNetworks } from "@/lib/social-share-urls";
import { PLUGIN_DEFAULT } from "@/js/constant/code";
import { customPluginHelper, pluginFactory } from "@/js/helper/pluginHelper";
import {
  getAllGlobalActions,
  setGlobalActions
} from "@/js/helper/actionHelper";
import util from "@/js/common/util";

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

export default {
  name: "Advanced",
  props: ["config", "i18nTexts"],

  data() {
    return {
      activeAdvancedName: ["userData"],
      socialNetworks: [],
      advancedLoaded: false,
      networkDialogVisible: false,
      currentNetwork: null,
      networkForm: {
        name: "",
        class: "",
        url: "",
        enable: true
      },
      networkRules: {
        name: [{ type: "string", required: true, trigger: "change" }],
        class: [{ type: "string", required: true, trigger: "change" }],
        url: [{ type: "string", required: true, trigger: "change" }]
      },
      customPlugins: [],
      currentCustomPlugin: null,
      textAlias: "",
      globalActions: ""
    };
  },

  created() {
    this.fetchCustomPlugins();
    this.fetchTextAlias();
    this.fetchGlobalActions();
  },

  mounted() {
    this.initAdvancedIfNeeded(); 
  },

  methods: {
    fetchCustomPlugins() {
      customPluginHelper.refresh().then(resp => {
        console.log(resp);
        this.customPlugins = resp || [];
      });
    },

    fetchTextAlias() {
      getTextAlias().then(text => {
        this.textAlias = text || "";
      });
    },

    fetchGlobalActions() {
      getAllGlobalActions().then(resp => {
        this.globalActions = JSON.stringify(resp);
      });
    },

    handleTextAliasSaveClick() {
      saveTextAlias(this.textAlias).then(() => {
        util.toast.success("Save successfully!");
      });
    },
  
    handleGlobalActionsSaveClick() {
      setGlobalActions(this.globalActions)
        .then(() => {
          util.toast.success("save successfully!");
        })
        .catch(msg => {
          util.toast.error(msg);
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
      if (file.type === "application/json") {
        readFile(file)
          .then(content => {
            let data;

            try {
              data = JSON.parse(content);
            } catch (error) {
              this.$message.error(chrome.i18n.getMessage("file_content_error"));

              return Promise.reject("File content is wrong");
            }

            return restoreData(data, this.config);
          })
          .then(resp => {
            console.log(resp);
            this.$message.success(chrome.i18n.getMessage("import_config_ok"));
            setTimeout(() => {
              window.location.reload();
            }, 500);
          })
          .catch(msg => {
            console.log(msg);
            this.$message.error(chrome.i18n.getMessage("import_config_failed"));
          });
      } else {
        this.$message.error(chrome.i18n.getMessage("file_type_wrong"));
      }

      return false;
    },

    handleResetClick() {
      this.$confirm(chrome.i18n.getMessage("reset_config_confirm"), "Prompt", {
        type: "warning"
      })
        .then(() => {
          restoreConfig().then(() => {
            this.$message(chrome.i18n.getMessage("reset_config_ok"));
            setTimeout(function() {
              window.location.reload();
            }, 500);
          });
        })
        .catch(() => {});
    },

    networksIconFormatter(row, column) {
      const icon = row[column.property];

      if (icon.startsWith("http")) {
        return icon;
      } else {
        return chrome.extension.getURL(`iconfont/share-icons/${icon}.svg`);
      }
    },

    saveNetworks() {
      return saveNetworks(JSON.parse(JSON.stringify(this.socialNetworks))).then(
        resp => {
          this.$message.success(chrome.i18n.getMessage("save_ok"));
        }
      );
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
        name: "",
        class: "",
        url: "",
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
          this.$message.error(chrome.i18n.getMessage("check_form"));
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
          name: "",
          source: PLUGIN_DEFAULT
        };
      }
    },

    refreshCustomPlugins() {
      this.customPlugins = customPluginHelper.getCustomPluginList();
    },

    async updatePlugin(meta) {
      const id = this.currentCustomPlugin.id;
      let result;

      if (id) {
        meta.id = id;
        result = await customPluginHelper.update(meta);
      } else {
        result = await customPluginHelper.create(meta);
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
        this.$message.success("Save successfully!");
      } else {
        this.$message.error(pluginFactory.errors[0]);
      }
    },

    handleCustomPluginDeleteClick() {
      this.$confirm(
        "This operation will permanently delete the plugin, whether to continue?",
        "Prompt",
        {
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          this.$message("Delete done!");
          customPluginHelper.remove(this.currentCustomPlugin.id);
          this.refreshCustomPlugins();
          this.currentWebsite = null;
        })
        .catch(() => {});
    }
  },

  components: {
  }
};
</script>

<style>
</style>