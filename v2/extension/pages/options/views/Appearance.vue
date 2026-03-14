<template>
  <div>
    <el-row>
      <el-col :span="3">
        <div class="appearance-items">
          <div
            v-for="(apprItem, index) in appearanceItems"
            :key="index"
            @click="handleApprItemClick(apprItem)"
            :class="['appearance-item', {'is-active': curApprItem ? curApprItem.name === apprItem.name : false}]"
          >
            <span class="appearance-item-name">{{apprItem.name}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="21">
        <div class="appearance-item-panel bg-black">
          <template v-if="curApprItem">
            <div class="themes-container" :style="themeContainerStyles">
              <div class="themes-info">
                <div class="preview steward" v-html="previewHtml"></div>
              </div>
              <div class="theme-editor">
                <el-form v-if="themeMode" :model="theme" label-width="258px">
                  <div>
                    <el-button
                      type="primary"
                      @click.native.prevent="handleThemeSave(themeMode)"
                    >{{i18nTexts.ui.settings.actions.applysave}}</el-button>
                    <el-button
                      type="warning"
                      @click.native.prevent="handleThemeReset(themeMode)"
                    >{{i18nTexts.ui.settings.actions.reset}}</el-button>
                    <el-button
                      @click="handleThemeExportClick"
                      type="primary"
                    >{{i18nTexts.ui.settings.actions.export}}</el-button>
                    <el-upload
                      style="display: inline-block;margin-left: 12px;"
                      accept="text/json"
                      action="/"
                      :before-upload="handleThemeBackupBeforeUpload"
                    >
                      <el-button type="primary">{{i18nTexts.ui.settings.actions.import}}</el-button>
                    </el-upload>
                  </div>
                  <div class="theme-field-type">Background Coloring</div>
                  <el-form-item v-if="themeMode === 'newtab'" label="New Tab:">
                    <el-color-picker
                      v-model="theme['--newtab-background-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="App:">
                    <el-color-picker
                      v-model="theme['--app-background-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Selected Search Suggestion:">
                    <el-color-picker
                      v-model="theme['--selected-suggestion-background-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Search Results Scrollbar:">
                    <el-color-picker
                      v-model="theme['--search-results-scrollbar-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>

                  <div class="theme-field-type">Text Coloring</div>
                  <el-form-item label="Search Input:">
                    <el-color-picker
                      v-model="theme['--search-input-value-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Selected Search Suggestion Title:">
                    <el-color-picker
                      v-model="theme['--selected-suggestion-title-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Selected Search Suggestion Subtitle:">
                    <el-color-picker
                      v-model="theme['--selected-suggestion-subtitle-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Search Suggestion Title:">
                    <el-color-picker
                      v-model="theme['--suggestion-title-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Search Suggestion Subtitle:">
                    <el-color-picker
                      v-model="theme['--suggestion-subtitle-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>
                  <el-form-item label="Highlighted Suggestion Title:">
                    <el-color-picker
                      v-model="theme['--highlighted-suggestion-text-color']"
                      :show-alpha="getColorType(themeMode)"
                    ></el-color-picker>
                  </el-form-item>

                  <div class="theme-field-type">Spacing</div>
                  <el-form-item label="Search Results Scrollbar Width:">
                    <el-input
                      type="text"
                      v-model="theme['--search-results-scrollbar-width']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>

                  <div class="theme-field-type">Text Sizing</div>
                  <el-form-item label="Search Input:">
                    <el-input
                      type="text"
                      v-model="theme['--search-input-value-text-size']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Search Suggestion Title:">
                    <el-input
                      type="text"
                      v-model="theme['--suggestion-title-text-size']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Search Suggestion Subtitle:">
                    <el-input
                      type="text"
                      v-model="theme['--suggestion-subtitle-text-size']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>

                  <div class="theme-field-type">Height</div>
                  <el-form-item label="Search Input:">
                    <el-input
                      type="text"
                      v-model="theme['--search-input-height']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Search Results:">
                    <el-input
                      type="text"
                      v-model="theme['--search-results-height']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>
                  <el-form-item label="Suggestion:">
                    <el-input
                      type="text"
                      v-model="theme['--suggestion-height']"
                      spellcheck="false"
                    ></el-input>
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </template>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import CONST from "constant/index";
import previewHtml from "@/pages/options/preview.html";
import { downloadAsJson, readFile } from "helper";
import * as defaultThemems from "conf/themes";
import storage from "utils/storage";
import { t } from 'helper/i18n.helper';

const appearanceItems = CONST.OPTIONS.APPEARANCE_ITEMS;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  props: ["config", "i18nTexts"],
  data() {
    return {
      curApprItem: null,
      appearanceItems,
      previewHtml,
      themeMode: "",
      themes: clone(defaultThemems),
      themeContainerStyles: {}
    };
  },

  computed: {
    theme() {
      return this.themes[this.themeMode];
    }
  },

  watch: {
    themeMode(newMode) {
      this.applyTheme(newMode);
    }
  },

  methods: {
    updateApprItem(apprItem) {
      this.curApprItem = apprItem;
      const mode = apprItem.name.replace(" ", "").toLowerCase();

      this.themeMode = mode;
    },

    handleApprItemClick: function(apprItem) {
      this.updateApprItem(apprItem);
    },

    loadThemes() {
      return storage.sync.get(CONST.STORAGE.THEMES).then(themes => {
        if (themes) {
          this.themes = themes;
        }
      });
    },

    saveThemes() {
      storage.sync
        .set({
          [CONST.STORAGE.THEMES]: this.themes
        })
        .then(() => {
          console.log("save themes successfully...");
        });
    },

    handleThemeSave(mode) {
      this.applyTheme(mode);

      this.saveThemes();
    },

    handleThemeReset(mode) {
      this.themes[mode] = Object.assign({}, defaultThemems[mode]);
      this.applyTheme(mode);
      this.saveThemes();
    },

    getColorType(mode) {
      if (mode === "popup") {
        return false;
      } else {
        return true;
      }
    },

    applyTheme(mode) {
      const theme = this.themes[mode] || this.defaultThemems[mode];

      if (theme) {
        const themeConfig = Object.assign({}, theme);
        const wallpaper =
          this.selectedWallpaper ||
          "http://www.bing.com/az/hprichbg/rb/MatusevichGlacier_EN-US13620113504_1920x1080.jpg";

        if (mode === "newtab") {
          themeConfig["--app-newtab-background-image"] = `url(${wallpaper})`;
          this.themeContainerStyles = {
            background:
              "var(--app-newtab-background-image) center center / cover no-repeat"
          };
        } else {
          this.themeContainerStyles = {};
        }

        let cssText = "";

        for (const prop in themeConfig) {
          cssText += `${prop}: ${themeConfig[prop]};`;
        }

        document.querySelector("html").style.cssText = cssText;
      }
    },

    handleThemeExportClick() {
      downloadAsJson(this.theme, `${this.themeMode}-theme`);
    },

    handleThemeBackupBeforeUpload(file) {
      if (file.type === "application/json") {
        readFile(file)
          .then(content => {
            let data;

            try {
              data = JSON.parse(content);

              return Promise.resolve(data);
            } catch (error) {
              this.$message.error(t("file_content_error"));

              return Promise.reject("File content is wrong");
            }
          })
          .then(data => {
            if (data && data["--app-background-color"]) {
              this.themes[this.themeMode] = data;
              this.handleThemeSave(this.themeMode);
            }
          });
      } else {
        this.$message.error(t("file_type_wrong"));
      }

      return false;
    }
  },
  mounted() {
    if (!this.curApprItem) {
      this.loadThemes().then(() => {
        this.updateApprItem(this.appearanceItems[0]);
      });
    } else {
      this.applyTheme(this.themeMode);
    }
  }
};
</script>

<style lang="scss">
@import '../../../scss/main.scss';
@import '../../../scss/themes/popup/classical.scss';

.appearance-item {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 3px 8px;
    height: 40px;
    position: relative;
}

.appearance-item.is-active {
    background: #20a0ff;
    color: #fff;
}

.appearance-item-icon {
    width: 20px;
    height: 20px;
    float: left;
}

.appearance-item-name {
    margin-left: 5px;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 100;
}

.appearance-item-panel {
    height: calc(100vh - 57px);
}

.themes-container {
    display: flex;
    padding: 15px;
    box-sizing: border-box;
    height: 100%;
}

.themes-info {
    font-size: 16px;
    color: #fff;
    text-align: center;
}

.theme-editor {
    flex: 1;
    margin-left: 15px;
    background: rgba(0, 0, 0, .8);
    color: #fff;
    height: 100%;
    overflow: auto;

    .el-form {
        margin: 12px;
    }

    .el-form-item {
        margin-bottom: 6px;
    }

    .el-form-item__label {
        color: #fff;
        text-align: left;
    }

    .el-input {
        width: 180px;
    }

    .theme-field-type {
        margin-top: 15px;
        margin-bottom: 10px;
        padding-bottom: 2px;
        border-bottom: 2px solid #fff;
        font-size: 20px;
    }

    .color-indicator {
        border: 1px solid #000;
    }
}
</style>