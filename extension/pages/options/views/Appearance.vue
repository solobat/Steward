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
import CONST from "@/js/constant";
import previewHtml from "@/pages/options/preview.html";
import { downloadAsJson, readFile } from "@/js/helper";
import * as defaultThemems from "@/js/conf/themes";
import storage from "@/js/utils/storage";

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
      window.localStorage.setItem("themes", JSON.stringify(this.themes));
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
              this.$message.error(chrome.i18n.getMessage("file_content_error"));

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
        this.$message.error(chrome.i18n.getMessage("file_type_wrong"));
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

<style>
</style>