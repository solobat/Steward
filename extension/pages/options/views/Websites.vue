<template>
  <div>
    <el-row>
      <el-col :span="5">
        <div class="grid-content plugin-list">
          <div class="plugin-searchbar">
            <el-input placeholder="Search" icon="search" v-model="websiteSearchText"></el-input>
          </div>
          <div class="button-bar">
            <el-button
              type="primary"
              icon="plus"
              @click="handleNewWebsiteClick"
            >{{i18nTexts.ui.settings.actions.newwebsite}}</el-button>
          </div>
          <div
            class="plugin-item website-item"
            :class="{'is-selected': website.title === (currentWebsite && currentWebsite.title)}"
            v-for="(website, index) in filteredWebsites"
            :key="index"
            @click="handleWebsiteClick(website)"
          >
            <span class="plugin-name">{{website.title}}</span>
          </div>
        </div>
      </el-col>
      <el-col :span="19">
        <div class="grid-content bg-black plugin-editor">
          <div v-if="currentWebsite" class="plugin-editor-container">
            <div class="plugin-editor-header">
              <div class="plugin-editor-text">
                <p
                  class="plugin-editor-title"
                >{{i18nTexts.ui.settings.notion.website}} - {{currentWebsite.title}}</p>
              </div>
            </div>
            <div class="plugin-editor-config" style="overflow-y: auto;">
              <el-tabs style="height: 100%;" type="border-card" @tab-click="handleWebsiteTabClick">
                <el-tab-pane label="Simple Editor">
                  <el-form
                    style="padding: 12px; min-height: 150px;"
                    ref="websiteForm"
                    :model="currentWebsite"
                    :rules="websiteFormRuels"
                    label-width="200px"
                  >
                    <el-collapse v-model="activeFieldsName">
                      <el-collapse-item
                        name="meta"
                        :title="i18nTexts.ui.settings.blocks.websitebaseinfo"
                      >
                        <el-form-item :label="i18nTexts.ui.settings.fields.title" prop="title">
                          <el-input
                            type="text"
                            style="width: 300px;"
                            v-model="currentWebsite.title"
                          ></el-input>
                        </el-form-item>
                        <el-form-item :label="i18nTexts.ui.settings.fields.host" prop="host">
                          <el-input type="text" style="width: 300px;" v-model="currentWebsite.host"></el-input>
                        </el-form-item>
                        <el-form-item :label="i18nTexts.ui.settings.fields.siteicon">
                          <el-input
                            type="text"
                            style="width: 300px;"
                            v-model="currentWebsite.icon"
                            placeholder="https://baidu.com/favicon.ico"
                          ></el-input>
                        </el-form-item>
                      </el-collapse-item>
                      <el-collapse-item
                        :title="i18nTexts.ui.settings.blocks.websitenav"
                        name="site"
                      >
                        <el-form-item :label="i18nTexts.ui.settings.fields.paths">
                          <div class="paths-container">
                            <el-row>
                              <el-col :span="6">
                                <el-input
                                  v-model="newPath.title"
                                  placeholder="Title"
                                  @keyup.enter.native="handleNewPathAddClick"
                                ></el-input>
                              </el-col>
                              <el-col :span="10" :offset="1">
                                <el-input
                                  v-model="newPath.urlPattern"
                                  placeholder="URL Pattern"
                                  @keyup.enter.native="handleNewPathAddClick"
                                ></el-input>
                              </el-col>
                              <el-col :span="4" :offset="1">
                                <el-button
                                  @click="handleNewPathAddClick"
                                  type="primary"
                                  icon="plus"
                                ></el-button>
                              </el-col>
                            </el-row>
                            <el-row v-for="(path, index) in this.currentWebsite.paths" :key="index">
                              <el-col :span="6">
                                <el-input
                                  v-model="path.title"
                                  placeholder="Title"
                                  :disabled="!path.editable"
                                ></el-input>
                              </el-col>
                              <el-col :span="10" :offset="1">
                                <el-input
                                  v-model="path.urlPattern"
                                  placeholder="URL Pattern"
                                  :disabled="!path.editable"
                                ></el-input>
                              </el-col>
                              <el-col :span="4" :offset="1">
                                <el-button
                                  @click="handlePathEditClick(path)"
                                  type="primary"
                                  :icon="path.editable ? 'check' : 'edit'"
                                ></el-button>
                                <el-button
                                  @click="handleNewPathDeleteClick(index)"
                                  type="primary"
                                  icon="delete"
                                ></el-button>
                              </el-col>
                            </el-row>
                          </div>
                        </el-form-item>
                        <el-form-item label="Path Variables" v-if="currentWebsite.vars">
                          <div class="vars-container">
                            <el-row v-for="(value, key) in currentWebsite.vars" :key="key">
                              <el-col :span="6">
                                <el-input v-model="currentWebsite.vars[key]" placeholder>
                                  <template slot="prepend">{{key}}</template>
                                </el-input>
                              </el-col>
                            </el-row>
                          </div>
                        </el-form-item>
                        <el-form-item :label="i18nTexts.ui.settings.fields.navigations">
                          <el-col :span="17">
                            <el-input
                              type="textarea"
                              :rows="2"
                              autosize
                              placeholder="such as: nav > ul > li > a"
                              v-model="currentWebsite.navs"
                            ></el-input>
                          </el-col>
                        </el-form-item>
                      </el-collapse-item>
                      <el-collapse-item
                        name="inpage"
                        :title="i18nTexts.ui.settings.blocks.inpagenav"
                      >
                        <el-form-item :label="i18nTexts.ui.settings.fields.outlinescope">
                          <el-col :span="17">
                            <el-input
                              placeholder="such as: .markdown-body"
                              v-model="currentWebsite.outlineScope"
                            ></el-input>
                          </el-col>
                        </el-form-item>
                        <el-form-item :label="i18nTexts.ui.settings.fields.anchors">
                          <div class="paths-container">
                            <el-row>
                              <el-col :span="6">
                                <el-input
                                  v-model="newAnchor.title"
                                  placeholder="Title"
                                  @keyup.enter.native="handleNewAnchorAddClick"
                                ></el-input>
                              </el-col>
                              <el-col :span="10" :offset="1">
                                <el-input
                                  v-model="newAnchor.selector"
                                  placeholder="CSS Selector"
                                  @keyup.enter.native="handleNewAnchorAddClick"
                                ></el-input>
                              </el-col>
                              <el-col :span="4" :offset="1">
                                <el-button
                                  @click="handleNewAnchorAddClick"
                                  type="primary"
                                  icon="plus"
                                ></el-button>
                              </el-col>
                            </el-row>
                            <el-row
                              v-for="(anchor, index) in this.currentWebsite.anchors"
                              :key="index"
                            >
                              <el-col :span="6">
                                <el-input
                                  v-model="anchor.title"
                                  placeholder="Title"
                                  :disabled="!anchor.editable"
                                ></el-input>
                              </el-col>
                              <el-col :span="10" :offset="1">
                                <el-input
                                  v-model="anchor.selector"
                                  placeholder="CSS Selector"
                                  :disabled="!anchor.editable"
                                ></el-input>
                              </el-col>
                              <el-col :span="4" :offset="1">
                                <el-button
                                  @click="anchor.editable = !anchor.editable"
                                  type="primary"
                                  :icon="anchor.editable ? 'check' : 'edit'"
                                ></el-button>
                                <el-button
                                  @click="handleNewAnchorDeleteClick(index)"
                                  type="primary"
                                  icon="delete"
                                ></el-button>
                              </el-col>
                            </el-row>
                          </div>
                        </el-form-item>
                      </el-collapse-item>
                    </el-collapse>
                    <el-form-item :label="i18nTexts.ui.settings.fields.disable">
                      <el-switch v-model="currentWebsite.disabled" on-color="#20a0ff"></el-switch>
                    </el-form-item>
                    <el-form-item>
                      <el-button
                        type="primary"
                        @click.native.prevent="handleWebsiteSubmit"
                      >{{i18nTexts.ui.settings.actions.save}}</el-button>
                      <el-button
                        v-if="currentWebsite.id"
                        @click="handleWebsiteExportClick"
                        type="info"
                      >{{i18nTexts.ui.settings.actions.export}}</el-button>
                      <el-button
                        v-if="currentWebsite.id"
                        type="warning"
                        @click.native.prevent="handleWebsiteDelete(currentWebsite.id)"
                      >{{i18nTexts.ui.settings.actions.delete}}</el-button>
                    </el-form-item>
                  </el-form>
                </el-tab-pane>
                <el-tab-pane label="Advanced Editor">
                  <el-input
                    class="editor"
                    v-if="websiteTabIndex === 1"
                    v-model="currentWebsiteSource"
                    :rows="10"
                    type="textarea"
                  />
                  <div class="buttons" style="margin-top: 20px;">
                    <el-button
                      type="primary"
                      @click.native.prevent="handleWebsiteCodeSubmit"
                    >{{i18nTexts.ui.settings.actions.save}}</el-button>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import websiteHelper from "helper/websites.helper";
import util from "common/util";
import { downloadAsJson } from "helper";
import { t } from 'helper/i18n.helper';

export default {
  name: 'Websites',
  props: ["config", "i18nTexts"],

  data() {
    return {
      websiteSearchText: "",
      websites: [],
      currentWebsite: null,
      websiteTabIndex: 0,
      currentWebsiteSource: "",
      activeFieldsName: ["meta"],
      newPath: {
        title: "",
        urlPattern: "",
        editable: false
      },
      newAnchor: {
        title: "",
        selector: "",
        editable: false
      },
      websiteFormRuels: {
        title: [{ type: "string", required: true, trigger: "change" }],
        host: [
          {
            type: "string",
            required: true,
            trigger: "change",
            message: "Host or minimatch is required"
          }
        ]
      }
    };
  },

  computed: {
    filteredWebsites() {
      const text = this.websiteSearchText.toLowerCase();

      return this.websites.filter(website => {
        return website.title.toLowerCase().indexOf(text) > -1;
      });
    }
  },

  created() {
    websiteHelper.init().then((resp = []) => {
      this.websites = resp;
    });
  },

  methods: {
    handleWebsiteClick(website) {
      const data = JSON.parse(JSON.stringify(website));

      if (!data.anchors) {
        data.anchors = [];
      }

      ["anchors", "paths"].forEach(key => {
        data[key].forEach(item => {
          item.editable = false;
        });
      });

      this.currentWebsite = data;
      if (this.websiteTabIndex === 1) {
        this.updateCurrentSource();
      }
    },

    updateCurrentSource() {
      this.currentWebsiteSource = JSON.stringify(this.currentWebsite || {});
    },

    handleWebsiteTabClick(tab) {
      const idx = Number(tab.index);

      if (idx === 1) {
        this.updateCurrentSource();
      }
      this.websiteTabIndex = idx;
    },

    resetCurrentWebsite() {
      this.currentWebsite = {
        title: "New Website",
        host: "",
        icon: "",
        paths: [],
        navs: "nav a",
        disabled: false,
        outlineScope: "",
        vars: {},
        anchors: []
      };
      this.updateCurrentSource();
    },

    handleNewWebsiteClick() {
      this.resetCurrentWebsite();
    },

    validateNewPath() {
      if (!this.newPath.title || !this.newPath.urlPattern) {
        return "Title and URL Pattern is required!";
      } else {
        let msg;

        this.currentWebsite.paths.forEach(path => {
          if (path.title === this.newPath.title) {
            msg = "Title is repeated!";
          } else if (path.urlPattern === this.newPath.urlPattern) {
            msg = "URL Pattern is repeated!";
          }
        });

        return msg;
      }
    },

    updateVars() {
      const vars = {};
      const reg = /\{\{([A-Za-z0-9_]+)\}\}/g;
      const theVars = this.currentWebsite.vars || {};

      this.currentWebsite.paths.forEach(path => {
        const match = path.urlPattern.match(reg);

        if (match) {
          match
            .map(item => item.replace(/[{}]/g, ""))
            .forEach(key => {
              if (!vars[key]) {
                vars[key] = "var";
              }
            });
        }
      });

      for (const key in vars) {
        if (theVars[key]) {
          vars[key] = theVars[key];
        }
      }

      this.currentWebsite.vars = vars;
    },

    handleNewPathAddClick() {
      const msg = this.validateNewPath();

      if (msg) {
        this.$message(msg);
      } else {
        this.currentWebsite.paths.push(this.newPath);
        this.updateVars();
        this.newPath = {
          title: "",
          urlPattern: "",
          editable: false
        };
      }
    },

    handleNewPathDeleteClick(index) {
      this.currentWebsite.paths.splice(index, 1);
      this.updateVars();
    },

    handlePathEditClick(path) {
      path.editable = !path.editable;
      this.updateVars();
    },

    validateNewAnchor() {
      if (!this.newAnchor.title || !this.newAnchor.selector) {
        return "Title and Selector is required!";
      } else {
        let msg;

        this.currentWebsite.anchors.forEach(anchor => {
          if (anchor.title === this.newAnchor.title) {
            msg = "Title is repeated!";
          } else if (anchor.selector === this.newAnchor.selector) {
            msg = "Selector is repeated!";
          }
        });

        return msg;
      }
    },

    handleNewAnchorAddClick() {
      const msg = this.validateNewAnchor();

      if (msg) {
        this.$message(msg);
      } else {
        this.currentWebsite.anchors.push(this.newAnchor);
        this.newAnchor = {
          title: "",
          selector: "",
          editable: false
        };
      }
    },

    handleNewAnchorDeleteClick(index) {
      this.currentWebsite.anchors.splice(index, 1);
    },

    handleWebsiteBeforeSave() {
      const website = JSON.parse(JSON.stringify(this.currentWebsite));

      ["paths", "anchors"].forEach(key => {
        website[key].forEach(item => {
          Reflect.deleteProperty(item, "editable");
        });
      });

      return website;
    },

    submitWebsite() {
      const data = this.handleWebsiteBeforeSave();

      return websiteHelper.save(data).then(website => {
        this.afterWebsiteSubmit(website.toJSON());
        this.$message(t("save_ok"));
      });
    },

    refreshWebsites() {
      this.websites = websiteHelper.getWebsiteList();
    },

    afterWebsiteSubmit(website) {
      this.refreshWebsites();
      this.currentWebsite = website;
      this.updateCurrentSource();
    },

    handleWebsiteSubmit() {
      this.$refs.websiteForm.validate(valid => {
        if (!valid) {
          this.$message.error(t("check_form"));
        } else {
          this.submitWebsite();
        }
      });
    },

    handleWebsiteCodeSubmit() {
      try {
        this.currentWebsite = JSON.parse(this.currentWebsiteSource);
        this.submitWebsite();
      } catch (error) {
        console.error(error);
      }
    },

    handleWebsiteExportClick() {
      downloadAsJson(
        this.currentWebsite,
        `${this.currentWebsite.title} website`
      );
    },

    handleWebsiteDelete(id) {
      this.$confirm(
        util.getTextMsg("confirm_delete_tpl", "settings_notion_website"),
        "Prompt",
        {
          confirmButtonText: "Delete",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          this.$message(t("delete_ok"));
          websiteHelper.remove(id);
          this.refreshWebsites();
          this.currentWebsite = null;
          this.updateCurrentSource();
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
