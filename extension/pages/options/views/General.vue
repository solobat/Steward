<template>
  <div class="general-panel">
    <el-form style="margin: 20px 0; min-height: 150px;" ref="general" :model="config.general">
      <el-collapse v-model="activeGeneralConfigName">
        <el-collapse-item name="command" :title="i18nTexts.ui.settings.blocks.commandsplugins">
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.cacheLastCmd">
                <el-switch v-model="config.general.cacheLastCmd" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.autoHideCmd">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="i18nTexts.tips.autoHideCmd"
                  placement="top-start"
                >
                  <el-switch v-model="config.general.autoHideCmd" on-color="#20a0ff"></el-switch>
                </el-tooltip>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.defaultPlugin">
                <el-select
                  v-model="config.general.defaultPlugin"
                  clearable
                  :disabled="config.general.cacheLastCmd"
                  placeholder="please choose"
                >
                  <el-option
                    v-for="item in defaultPlugins"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.customCmd">
                <el-input
                  style="width: 200px;"
                  v-model="config.general.customCmd"
                  :disabled="config.general.cacheLastCmd || config.general.defaultPlugin !== 'Other'"
                  placeholder="enter your command"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.storeTypedQuery">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="i18nTexts.tips.storeTypedQuery"
                  placement="top-start"
                >
                  <el-switch v-model="config.general.storeTypedQuery" on-color="#20a0ff"></el-switch>
                </el-tooltip>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item
          name="operation"
          :title="i18nTexts.ui.settings.blocks.operationinteraction"
        >
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.maxOperandsNum">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="i18nTexts.tips.maxOperandsNum"
                  placement="top-start"
                >
                  <el-input-number
                    v-model="config.general.maxOperandsNum"
                    :min="1"
                    :max="10"
                    :label="i18nTexts.general.maxOperandsNum"
                  ></el-input-number>
                </el-tooltip>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.autoScrollToMiddle">
                <el-tooltip
                  class="item"
                  effect="dark"
                  :content="i18nTexts.tips.autoScrollToMiddle"
                  placement="top-start"
                >
                  <el-switch v-model="config.general.autoScrollToMiddle" on-color="#20a0ff"></el-switch>
                </el-tooltip>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.autoResizeBoxFontSize">
                <el-switch v-model="config.general.autoResizeBoxFontSize" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.autoSelectByMouse">
                <el-switch v-model="config.general.autoSelectByMouse" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item
          name="websites"
          :title="i18nTexts.ui.settings.blocks.websitesconfiguration"
        >
          <el-row>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.autoCreateWebsite">
                <el-switch v-model="config.general.autoCreateWebsite" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.websiteUrls">
                <el-switch v-model="config.general.websiteUrls" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.websiteShareUrls">
                <el-switch v-model="config.general.websiteShareUrls" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item name="appearance" :title="i18nTexts.ui.settings.blocks.newtab">
          <el-row>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.wallpaperSources">
                <el-select
                  v-model="config.general.wallpaperSources"
                  multiple
                  placeholder="Please choose at least one"
                >
                  <el-option
                    v-for="item in wallpaperSources"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.enableRandomWallpaper">
                <el-switch v-model="config.general.enableRandomWallpaper" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="i18nTexts.general.componentsMirror">
                <el-select
                  v-model="config.general.componentsMirror"
                  placeholder="Please choose at least one"
                >
                  <el-option
                    v-for="item in mirrors"
                    :key="item.value"
                    :label="item.name"
                    :value="item.id"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item name="performance" :title="i18nTexts.ui.settings.blocks.performance">
          <el-row>
            <el-col :span="12">
              <el-form-item :label="i18nTexts.general.speedFirst">
                <el-switch v-model="config.general.speedFirst" on-color="#20a0ff"></el-switch>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
        <el-collapse-item
          class="shortcuts-config"
          name="shortcuts"
          :title="i18nTexts.ui.settings.blocks.shortcutconfiguration"
        >
          <el-row>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_0.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_0.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_1.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_1.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_2.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_2.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_3.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_3.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_4.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_4.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_5.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_5.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_6.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_6.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_7.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_7.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_8.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_8.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_9.cmd">
                <el-input
                  v-model="config.general.shortcuts.pageboxShortcut_9.cmd"
                  placeholder="command"
                ></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-collapse-item>
      </el-collapse>
      <el-form-item style="margin-top: 20px;margin-left: 20px;">
        <el-button
          type="primary"
          @click.native.prevent="handleGeneralSubmit"
        >{{i18nTexts.ui.settings.actions.save}}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import CONST from "@/js/constant";

export default {
  name: "Home",
  props: ["config", "i18nTexts"],

  data() {
    return {
      activeGeneralConfigName: ["command"],
      defaultPlugins: CONST.OPTIONS.DEFAULT_PLUGINS,
      wallpaperSources: CONST.OPTIONS.WALLPAPER_SOURCES,
      newtabWidgets: CONST.OPTIONS.NEWTAB_WIDGETS,
      mirrors: CONST.OPTIONS.MIRRORS
    };
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
    handleGeneralSubmit: function() {
      this.saveConfig();
    }
  }
};
</script>

<style>
</style>