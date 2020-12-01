<template>
  <div>
    <el-row>
      <el-col :span="5">
        <div class="grid-content plugin-list">
          <div class="plugin-searchbar">
            <el-input placeholder="Search" icon="search" v-model="pluginSearchText"></el-input>
          </div>
          <div
            class="plugin-item"
            v-for="(plugin, index) in filteredPlugins"
            :key="index"
            :class="{'plugin-disabled': isPluginDisabled(plugin), 'is-selected': plugin === currentPlugin}"
            @click="handlePluginClick(plugin)"
          >
            <img :src="plugin.icon" class="plugin-icon" alt />
            <span class="plugin-name">{{plugin.name}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="19">
        <div class="grid-content bg-black plugin-editor">
          <div v-if="currentPlugin" class="plugin-editor-container">
            <div class="plugin-editor-header">
              <img :src="currentPlugin.icon" class="plugin-editor-icon" alt />
              <div class="plugin-editor-text">
                <p class="plugin-editor-name">
                  {{currentPlugin.name}} - v{{currentPlugin.version}}
                  <el-button
                    type="text"
                    v-if="currentPlugin.authenticate"
                    @click="handlePluginAuth(currentPlugin)"
                  >重新授权</el-button>
                  <a
                    class="plugin-doc"
                    :href="getDocumentURL(currentPlugin)"
                    target="_blank"
                  >Documentation</a>
                </p>
                <p class="plugin-editor-title">{{currentPlugin.title}}</p>
              </div>
            </div>
            <div class="plugin-editor-config" v-if="hasKeywordCommands">
              <el-form
                style="margin: 20px;padding: 12px; min-height: 150px;"
                ref="form"
                :model="config.plugins"
                label-width="200px"
              >
                <el-form-item
                  :label="command.title"
                  v-for="(command, index) in currentPlugin.commands"
                  v-if="command.type === 'keyword'"
                  :key="index"
                >
                  <el-input
                    type="text"
                    style="width: 100px;"
                    :disabled="!command.editable"
                    v-model="config.plugins[currentPlugin.name].commands[index].key"
                  ></el-input>
                  <el-tooltip
                    v-if="command.shiftKey"
                    class="item"
                    effect="dark"
                    :content="i18nTexts.tips[command.orkey + '_shift'] || 'support shiftKey'"
                    placement="top-start"
                  >
                    <span style="color: #878d99">⇧</span>
                  </el-tooltip>
                  <el-tooltip
                    v-if="command.allowBatch"
                    class="item"
                    effect="dark"
                    :content="i18nTexts.tips.allowBatch"
                    placement="top-start"
                  >
                    <img src="/iconfont/allowbatch.svg" class="icon-batch" alt />
                  </el-tooltip>
                </el-form-item>
                <el-form-item v-if="currentPlugin.canDisabled" label="Disable">
                  <el-switch
                    v-model="config.plugins[currentPlugin.name].disabled"
                    on-color="#20a0ff"
                  ></el-switch>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    @click.native.prevent="handlePluginsSubmit"
                  >{{i18nTexts.ui.settings.actions.save}}</el-button>
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
import { getStaticPlugins } from "plugins";
import util from "common/util";
import CONST from "constant";
import _ from "underscore";

// plugins: { [pname]: { version, commands } }
const pluginModules = _.sortBy(
  getStaticPlugins().filter(item => item.commands),
  "name"
).map(plugin => {
  const {
    name,
    icon,
    commands,
    title,
    disabled,
    canDisabled,
    authenticate
  } = plugin;

  const ret = {
    name,
    version: plugin.version,
    category: plugin.category,
    commands,
    title,
    icon,
    canDisabled,
    authenticate
  };

  if (canDisabled) {
    ret.disabled = disabled;
  }

  return ret;
});

export default {
  name: 'Plugins',

  props: ["config", "i18nTexts"],

  data() {
    return {
      pluginSearchText: "",
      currentPlugin: null,
      defaultPlugins: CONST.OPTIONS.DEFAULT_PLUGINS
    };
  },

  computed: {
    filteredPlugins: function() {
      const text = this.pluginSearchText.toLowerCase();

      return pluginModules.filter(plugin => {
        return plugin.name.toLowerCase().indexOf(text) > -1;
      });
    },

    hasKeywordCommands() {
      if (this.currentPlugin && this.currentPlugin.commands) {
        return (
          this.currentPlugin.commands.filter(cmd => cmd.type === "keyword")
            .length > 0
        );
      } else {
        return false;
      }
    }
  },

  methods: {
    saveConfig: function(silent) {
      const that = this;
      const newConfig = JSON.parse(JSON.stringify(this.config));

      chrome.storage.sync.set(
        {
          [CONST.STORAGE.CONFIG]: newConfig
        },
        function() {
          if (silent) {
            console.log("save successfully");
          } else {
            that.$message(chrome.i18n.getMessage("save_ok"));
          }
        }
      );
    },
    isPluginDisabled(plugin) {
      const pname = plugin.name;
      const pluginsData = this.config.plugins;

      if (pluginsData[pname] && pluginsData[pname].disabled) {
        return true;
      } else {
        return false;
      }
    },

    getDocumentURL: function(plugin) {
      return util.getDocumentURL(plugin.name, plugin.category);
    },

    handlePluginClick: function(plugin) {
      this.currentPlugin = plugin;
    },

    handlePluginAuth(plugin) {
      plugin.authenticate();
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
      const tipsFn = ({ trigger, name }) =>
        `「${trigger}」-- plugin 「${name}」`;

      if (checkInfo.length > 0) {
        this.$message.warning(
          `trigger conflict: ${checkInfo.map(tipsFn).join("; ")}`
        );
      } else {
        this.saveConfig();
      }
    }
  }
};
</script>

<style>
</style>
