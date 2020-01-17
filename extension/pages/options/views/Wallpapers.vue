<template>
  <div>
    <div class="wallpapers-container">
      <div class="wallpaper-box">
        <div class="wallpaper-add-btn" @click="handleAddWallpaperClick">
          <img src="/iconfont/plus.svg" alt />
        </div>
      </div>
      <div
        v-for="(wallpaper, index) in wallpapers"
        :key="index"
        @click="chooseWallpaper(wallpaper)"
        :class="['wallpaper-box', {'is-selected': selectedWallpaper === wallpaper}]"
      >
        <img class="wallpaper-img" :ref="`wp${index}`" :src="wallpaper" alt />
        <img
          v-if="selectedWallpaper === wallpaper"
          class="selected-icon"
          src="/iconfont/selected-icon.svg"
          alt
        />
        <img
          src="/iconfont/delete-icon.svg"
          alt
          class="delete-wp icon"
          @click.stop="confirmDeleteWallpaper(wallpaper)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CONST from "../../../js/constant";
import storage from "../../../js/utils/storage";
import { saveWallpaperLink } from "../../../js/helper/wallpaper";
import util from "../../../js/common/util";

export default {
  name: 'Wallpapers',
  props: ["config", "i18nTexts"],

  data() {
    return {
      wallpapersLoaded: false,
      wallpapers: [],
      selectedWallpaper:
        window.localStorage.getItem(CONST.STORAGE.WALLPAPER) || "",
      wallpaperSources: CONST.OPTIONS.WALLPAPER_SOURCES
    };
  },

  methods: {
    loadWallpapersIfNeeded: function() {
      if (!this.wallpapersLoaded) {
        storage.sync.get(CONST.STORAGE.WALLPAPERS).then(wallpapers => {
          this.wallpapers = wallpapers;
          this.wallpapersLoaded = true;
        });
      }
    },

    handleAddWallpaperClick() {
      this.$prompt("Please enter your wallpaper link", "prompt", {
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        inputPattern: /(https?:\/\/.*\.(?:png|jpg|jpeg))/i,
        inputErrorMessage: "Image format is incorrect"
      })
        .then(({ value }) => {
          console.log(value);
          this.saveWallpaper(value);
        })
        .catch(() => {
          console.log("user cancel");
        });
    },

    saveWallpaper(url) {
      saveWallpaperLink(url)
        .then(() => {
          this.wallpapers.push(url);
          this.$message.success("Add new wallpaper successfully!");
        })
        .catch(msg => {
          this.$message.warning(msg);
        });
    },

    chooseWallpaper: function(wallpaper) {
      const KEY = CONST.STORAGE.WALLPAPER;

      if (this.selectedWallpaper === wallpaper) {
        this.selectedWallpaper = "";
        window.localStorage.removeItem(KEY);
      } else {
        this.selectedWallpaper = wallpaper;
        window.localStorage.setItem(KEY, wallpaper);
      }

      this.$message(chrome.i18n.getMessage("set_ok"));
    },

    confirmDeleteWallpaper: function(wallpaper) {
      this.$confirm(
        util.getTextMsg("confirm_delete_tpl", "settings_notion_wallpaper"),
        "Prompt",
        {
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          this.deleteWallpaper(wallpaper);
        })
        .catch(() => {});
    },

    deleteWallpaper: function(wallpaper) {
      const wpIdx = this.wallpapers.indexOf(wallpaper);

      if (wpIdx !== -1) {
        this.wallpapers.splice(wpIdx, 1);
      }

      storage.sync
        .set({
          wallpapers: this.wallpapers
        })
        .then(() => {
          this.$message({
            type: "success",
            message: chrome.i18n.getMessage("delete_ok")
          });
        });
    }
  },
  mounted() {
    this.loadWallpapersIfNeeded();
  }
};
</script>

<style>
</style>