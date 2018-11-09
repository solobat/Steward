<template>
    <div class="container">
        <el-tabs v-model="activeName" @tab-click="handleTabClick">
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.general" name="general" class="general-panel">
                <el-form style="margin: 20px 0; min-height: 150px;" ref="general" :model="config.general">
                    <el-collapse v-model="activeGeneralConfigName">
                        <el-collapse-item name="command" :title="i18nTexts.ui.settings.blocks.commandsplugins">
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.cacheLastCmd">
                                        <el-switch
                                            v-model="config.general.cacheLastCmd"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.autoHideCmd">
                                        <el-tooltip class="item" effect="dark" :content="i18nTexts.tips.autoHideCmd" placement="top-start">
                                            <el-switch
                                                v-model="config.general.autoHideCmd"
                                                on-color="#20a0ff">
                                            </el-switch>
                                        </el-tooltip>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.defaultPlugin">
                                        <el-select v-model="config.general.defaultPlugin" clearable :disabled="config.general.cacheLastCmd" placeholder="please choose">
                                            <el-option
                                                v-for="item in defaultPlugins"
                                                :key="item.value"
                                                :label="item.label"
                                                :value="item.value">
                                            </el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.customCmd">
                                        <el-input style="width: 200px;" v-model="config.general.customCmd" :disabled="config.general.cacheLastCmd || config.general.defaultPlugin !== 'Other'" placeholder="enter your command">
                                        </el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.storeTypedQuery">
                                        <el-tooltip class="item" effect="dark" :content="i18nTexts.tips.storeTypedQuery" placement="top-start">
                                            <el-switch
                                                v-model="config.general.storeTypedQuery"
                                                on-color="#20a0ff">
                                            </el-switch>
                                        </el-tooltip>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                        <el-collapse-item name="operation" :title="i18nTexts.ui.settings.blocks.operationinteraction">
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.maxOperandsNum">
                                        <el-tooltip class="item" effect="dark" :content="i18nTexts.tips.maxOperandsNum" placement="top-start">
                                            <el-input-number v-model="config.general.maxOperandsNum" :min="1" :max="10" :label="i18nTexts.general.maxOperandsNum"></el-input-number>
                                        </el-tooltip>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.autoScrollToMiddle">
                                        <el-tooltip class="item" effect="dark" :content="i18nTexts.tips.autoScrollToMiddle" placement="top-start">
                                            <el-switch
                                                v-model="config.general.autoScrollToMiddle"
                                                on-color="#20a0ff">
                                            </el-switch>
                                        </el-tooltip>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.autoResizeBoxFontSize">
                                        <el-switch
                                            v-model="config.general.autoResizeBoxFontSize"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.autoSelectByMouse">
                                        <el-switch
                                            v-model="config.general.autoSelectByMouse"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                        <el-collapse-item name="websites" :title="i18nTexts.ui.settings.blocks.websitesconfiguration">
                            <el-row>
                                <el-col :span="8">
                                    <el-form-item :label="i18nTexts.general.autoCreateWebsite">
                                        <el-switch
                                            v-model="config.general.autoCreateWebsite"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="i18nTexts.general.websiteUrls">
                                        <el-switch
                                            v-model="config.general.websiteUrls"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="8">
                                    <el-form-item :label="i18nTexts.general.websiteShareUrls">
                                        <el-switch
                                            v-model="config.general.websiteShareUrls"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                        <el-collapse-item name="appearance" :title="i18nTexts.ui.settings.blocks.newtab">
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.wallpaperSources">
                                        <el-select v-model="config.general.wallpaperSources" multiple placeholder="Please choose at least one">
                                            <el-option
                                                v-for="item in wallpaperSources"
                                                :key="item.value"
                                                :label="item.label"
                                                :value="item.value">
                                            </el-option>
                                        </el-select>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.enableRandomWallpaper">
                                        <el-switch
                                            v-model="config.general.enableRandomWallpaper"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                              <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.newtabWidgets">
                                        <el-select v-model="config.general.newtabWidgets" multiple placeholder="Please choose at least one">
                                            <el-option
                                                v-for="item in newtabWidgets"
                                                :key="item.value"
                                                :label="item.label"
                                                :value="item.value">
                                            </el-option>
                                        </el-select>
                                    </el-form-item>
                              </el-col>
                            </el-row>
                        </el-collapse-item>
                        <el-collapse-item name="performance" :title="i18nTexts.ui.settings.blocks.performance">
                            <el-row>
                                <el-col :span="12">
                                    <el-form-item :label="i18nTexts.general.speedFirst">
                                        <el-switch
                                            v-model="config.general.speedFirst"
                                            on-color="#20a0ff">
                                        </el-switch>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                        <el-collapse-item class="shortcuts-config" name="shortcuts" :title="i18nTexts.ui.settings.blocks.shortcutconfiguration">
                            <el-row>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_0.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_0.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_1.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_1.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_2.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_2.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_3.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_3.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_4.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_4.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-row>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_5.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_5.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_6.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_6.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_7.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_7.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_8.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_8.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="4">
                                    <el-form-item :label="i18nTexts.general.shortcuts.pageboxShortcut_9.cmd">
                                        <el-input v-model="config.general.shortcuts.pageboxShortcut_9.cmd" placeholder="command"></el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                    </el-collapse>
                    <el-form-item style="margin-top: 20px;">
                        <el-button type="primary" @click.native.prevent="handleGeneralSubmit">{{i18nTexts.ui.settings.actions.save}}</el-button>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.plugins" name="plugins">
                <el-row>
                    <el-col :span="5">
                        <div class="grid-content plugin-list">
                            <div class="plugin-searchbar">
                                <el-input placeholder="Search" icon="search" v-model="pluginSearchText">
                                </el-input>
                            </div>
                            <div class="plugin-item" v-for="(plugin, index) in filteredPlugins" :key="index"
                             :class="{'plugin-disabled': isPluginDisabled(plugin), 'is-selected': plugin === currentPlugin}"
                             @click="handlePluginClick(plugin)">
                                <img :src="plugin.icon" class="plugin-icon" alt="">
                                <span class="plugin-name">{{plugin.name}}</span>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="19">
                        <div class="grid-content bg-black plugin-editor">
                            <div v-if="currentPlugin" class="plugin-editor-container">
                                <div class="plugin-editor-header">
                                    <img :src="currentPlugin.icon" class="plugin-editor-icon" alt="">
                                    <div class="plugin-editor-text">
                                        <p class="plugin-editor-name">
                                            {{currentPlugin.name}} - v{{currentPlugin.version}}
                                            <el-button type="text" v-if="currentPlugin.authenticate" @click="handlePluginAuth(currentPlugin)">重新授权</el-button>
                                            <a class="plugin-doc" :href="getDocumentURL(currentPlugin)" target="_blank">Document</a>
                                        </p>
                                        <p class="plugin-editor-title">{{currentPlugin.title}}</p>
                                    </div>
                                </div>
                                <div class="plugin-editor-config" v-if="hasKeywordCommands">
                                    <el-form style="margin: 20px;padding: 12px; min-height: 150px;" ref="form" :model="config.plugins" label-width="200px">
                                        <el-form-item :label="command.title" v-for="(command, index) in currentPlugin.commands" v-if="command.type === 'keyword'" :key="index">
                                            <el-input type="text" style="width: 100px;"
                                                :disabled="!command.editable"
                                                v-model="config.plugins[currentPlugin.name].commands[index].key">
                                            </el-input>
                                            <el-tooltip v-if="command.shiftKey" class="item" effect="dark" :content="i18nTexts.tips[command.orkey + '_shift'] || 'support shiftKey'" placement="top-start">
                                                <span style="color: #878d99">⇧</span>
                                            </el-tooltip>
                                            <el-tooltip v-if="command.allowBatch" class="item" effect="dark" :content="i18nTexts.tips.allowBatch" placement="top-start">
                                                <img src="/iconfont/allowbatch.svg" class="icon-batch" alt="">
                                            </el-tooltip>
                                        </el-form-item>
                                        <el-form-item v-if="currentPlugin.canDisabled" label="Disable">
                                            <el-switch
                                                v-model="config.plugins[currentPlugin.name].disabled"
                                                on-color="#20a0ff">
                                            </el-switch>
                                        </el-form-item>
                                        <el-form-item>
                                            <el-button type="primary" @click.native.prevent="handlePluginsSubmit">{{i18nTexts.ui.settings.actions.save}}</el-button>
                                        </el-form-item>
                                    </el-form>
                                </div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.workflows" name="workflows">
                <el-row>
                    <el-col :span="5">
                        <div class="grid-content plugin-list">
                            <div class="plugin-searchbar">
                                <el-input placeholder="Search" icon="search" v-model="workflowSearchText">
                                </el-input>
                            </div>
                            <div class="button-bar">
                                <el-button type="primary" icon="plus" @click="handleNewWorkflowClick">{{i18nTexts.ui.settings.actions.newworkflow}}</el-button>
                            </div>
                            <div class="plugin-item workflow-item" :class="{'is-selected': workflow === currentWorkflow}"
                             v-for="(workflow, index) in filteredWorkflows" :key="index" @click="handleWorkflowClick(workflow)">
                                <span class="plugin-name">{{workflow.title}}</span>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="19">
                        <div class="grid-content bg-black plugin-editor">
                            <div v-if="currentWorkflow" class="plugin-editor-container">
                                <div class="plugin-editor-header">
                                    <div class="plugin-editor-text">
                                        <p class="plugin-editor-title">{{i18nTexts.ui.settings.notion.workflow}} - {{currentWorkflow.title}}</p>
                                    </div>
                                </div>
                                <div class="plugin-editor-config">
                                    <el-form style="margin: 20px;padding: 12px; min-height: 150px;" ref="form" :model="currentWorkflow" label-width="200px">
                                        <el-form-item :label="i18nTexts.ui.settings.fields.title">
                                            <el-input type="text" style="width: 300px;" v-model="currentWorkflow.title">
                                            </el-input>
                                        </el-form-item>
                                        <el-form-item :label="i18nTexts.ui.settings.fields.description">
                                            <el-input type="text" style="width: 300px;" v-model="currentWorkflow.desc">
                                            </el-input>
                                        </el-form-item>
                                        <el-form-item :label="i18nTexts.ui.settings.fields.content">
                                            <el-input autocorrect="off" autocapitalize="off" spellcheck="false" type="textarea" style="width: 300px;" :autosize="{ minRows: 5, maxRows: 12 }" placeholder="Please input your commands" v-model="currentWorkflow.content">
                                            </el-input>
                                            <el-tooltip class="item" effect="dark" content="Workflow Document" placement="top-start">
                                                <a href="http://oksteward.com/steward-documents/Workflows.html" target="_blank"><i class="el-icon-document"></i></a>
                                            </el-tooltip>
                                        </el-form-item>
                                        <el-form-item>
                                            <el-button type="primary" @click.native.prevent="handleWorkflowsSubmit">{{i18nTexts.ui.settings.actions.save}}</el-button>
                                            <el-button v-if="currentWorkflow.id" type="warning" @click.native.prevent="handleWorkflowsDelete">{{i18nTexts.ui.settings.actions.delete}}</el-button>
                                        </el-form-item>
                                    </el-form>
                                </div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.websites" name="websites">
                <el-row>
                    <el-col :span="5">
                        <div class="grid-content plugin-list">
                            <div class="plugin-searchbar">
                                <el-input placeholder="Search" icon="search" v-model="websiteSearchText">
                                </el-input>
                            </div>
                            <div class="button-bar">
                                <el-button type="primary" icon="plus" @click="handleNewWebsiteClick">{{i18nTexts.ui.settings.actions.newwebsite}}</el-button>
                            </div>
                            <div class="plugin-item website-item"
                             :class="{'is-selected': website.title === (currentWebsite && currentWebsite.title)}" 
                             v-for="(website, index) in filteredWebsites" :key="index"
                             @click="handleWebsiteClick(website)">
                                <span class="plugin-name">{{website.title}}</span>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="19">
                        <div class="grid-content bg-black plugin-editor">
                            <div v-if="currentWebsite" class="plugin-editor-container">
                                <div class="plugin-editor-header">
                                    <div class="plugin-editor-text">
                                        <p class="plugin-editor-title">{{i18nTexts.ui.settings.notion.website}} - {{currentWebsite.title}}</p>
                                    </div>
                                </div>
                                <div class="plugin-editor-config" style="max-height: 560px; overflow-y: auto;">
                                    <el-form style="margin: 20px;padding: 12px; min-height: 150px;" ref="websiteForm" :model="currentWebsite" :rules="websiteFormRuels" label-width="200px">
                                        <el-collapse v-model="activeFieldsName">
                                            <el-collapse-item name="meta" :title="i18nTexts.ui.settings.blocks.websitebaseinfo">
                                                <el-form-item :label="i18nTexts.ui.settings.fields.title" prop="title">
                                                    <el-input type="text" style="width: 300px;" v-model="currentWebsite.title">
                                                    </el-input>
                                                </el-form-item>
                                                <el-form-item :label="i18nTexts.ui.settings.fields.host" prop="host">
                                                    <el-input type="text" style="width: 300px;" v-model="currentWebsite.host">
                                                    </el-input>
                                                </el-form-item>
                                                <el-form-item :label="i18nTexts.ui.settings.fields.siteicon">
                                                    <el-input type="text" style="width: 300px;" v-model="currentWebsite.icon" placeholder="https://baidu.com/favicon.ico">
                                                    </el-input>
                                                </el-form-item>
                                            </el-collapse-item>
                                            <el-collapse-item :title="i18nTexts.ui.settings.blocks.websitenav" name="site">
                                                <el-form-item :label="i18nTexts.ui.settings.fields.paths">
                                                    <div class="paths-container">
                                                        <el-row>
                                                            <el-col :span="6">
                                                                <el-input v-model="newPath.title" placeholder="Title" @keyup.enter.native="handleNewPathAddClick"></el-input>
                                                            </el-col>
                                                            <el-col :span="10" :offset="1">
                                                                <el-input v-model="newPath.urlPattern" placeholder="URL Pattern" @keyup.enter.native="handleNewPathAddClick"></el-input>
                                                            </el-col>
                                                            <el-col :span="4" :offset="1">
                                                                <el-button @click="handleNewPathAddClick" type="primary" icon="plus"></el-button>
                                                            </el-col>
                                                        </el-row>
                                                        <el-row v-for="(path, index) in this.currentWebsite.paths" :key="index">
                                                            <el-col :span="6">
                                                                <el-input v-model="path.title" placeholder="Title" :disabled="!path.editable"></el-input>
                                                            </el-col>
                                                            <el-col :span="10" :offset="1">
                                                                <el-input v-model="path.urlPattern" placeholder="URL Pattern" :disabled="!path.editable"></el-input>
                                                            </el-col>
                                                            <el-col :span="4" :offset="1">
                                                                <el-button @click="handlePathEditClick(path)" type="primary" :icon="path.editable ? 'check' : 'edit'"></el-button>
                                                                <el-button @click="handleNewPathDeleteClick(index)" type="primary" icon="delete"></el-button>
                                                            </el-col>
                                                        </el-row>
                                                    </div>
                                                </el-form-item>
                                                <el-form-item label="Path Variables" v-if="currentWebsite.vars">
                                                    <div class="vars-container">
                                                        <el-row v-for="(value, key) in currentWebsite.vars" :key="key">
                                                          <el-col :span="6">
                                                                <el-input v-model="currentWebsite.vars[key]" placeholder="">
                                                                    <template slot="prepend">{{key}}</template>
                                                                </el-input>
                                                          </el-col>
                                                        </el-row>
                                                    </div>
                                                </el-form-item>
                                                <el-form-item :label="i18nTexts.ui.settings.fields.navigations">
                                                    <el-col :span="17">
                                                        <el-input type="textarea" :rows="2" autosize placeholder="such as: nav > ul > li > a" v-model="currentWebsite.navs"></el-input>
                                                    </el-col>
                                                </el-form-item>
                                            </el-collapse-item>
                                            <el-collapse-item name="inpage" :title="i18nTexts.ui.settings.blocks.inpagenav">
                                                <el-form-item :label="i18nTexts.ui.settings.fields.outlinescope">
                                                    <el-col :span="17">
                                                        <el-input placeholder="such as: .markdown-body" v-model="currentWebsite.outlineScope"></el-input>
                                                    </el-col>
                                                </el-form-item>
                                                <el-form-item :label="i18nTexts.ui.settings.fields.anchors">
                                                    <div class="paths-container">
                                                        <el-row>
                                                            <el-col :span="6">
                                                                <el-input v-model="newAnchor.title" placeholder="Title" @keyup.enter.native="handleNewAnchorAddClick"></el-input>
                                                            </el-col>
                                                            <el-col :span="10" :offset="1">
                                                                <el-input v-model="newAnchor.selector" placeholder="CSS Selector" @keyup.enter.native="handleNewAnchorAddClick"></el-input>
                                                            </el-col>
                                                            <el-col :span="4" :offset="1">
                                                                <el-button @click="handleNewAnchorAddClick" type="primary" icon="plus"></el-button>
                                                            </el-col>
                                                        </el-row>
                                                        <el-row v-for="(anchor, index) in this.currentWebsite.anchors" :key="index">
                                                            <el-col :span="6">
                                                                <el-input v-model="anchor.title" placeholder="Title" :disabled="!anchor.editable"></el-input>
                                                            </el-col>
                                                            <el-col :span="10" :offset="1">
                                                                <el-input v-model="anchor.selector" placeholder="CSS Selector" :disabled="!anchor.editable"></el-input>
                                                            </el-col>
                                                            <el-col :span="4" :offset="1">
                                                                <el-button @click="anchor.editable = !anchor.editable" type="primary" :icon="anchor.editable ? 'check' : 'edit'"></el-button>
                                                                <el-button @click="handleNewAnchorDeleteClick(index)" type="primary" icon="delete"></el-button>
                                                            </el-col>
                                                        </el-row>
                                                    </div>
                                                </el-form-item>
                                            </el-collapse-item>
                                        </el-collapse>
                                        <el-form-item :label="i18nTexts.ui.settings.fields.disable">
                                            <el-switch
                                                v-model="currentWebsite.disabled"
                                                on-color="#20a0ff">
                                            </el-switch>
                                        </el-form-item>
                                        <el-form-item>
                                            <el-button type="primary" @click.native.prevent="handleWebsiteSubmit">{{i18nTexts.ui.settings.actions.save}}</el-button>
                                            <el-button v-if="currentWebsite.id" @click="handleWebsiteExportClick" type="info">{{i18nTexts.ui.settings.actions.export}}</el-button>
                                            <el-button v-if="currentWebsite.id" type="warning" @click.native.prevent="handleWebsiteDelete(currentWebsite.id)">{{i18nTexts.ui.settings.actions.delete}}</el-button>
                                        </el-form-item>
                                    </el-form>
                                </div>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.wallpapers" name="wallpapers">
                <div class="wallpapers-container">
                    <div class="wallpaper-box">
                        <div class="wallpaper-add-btn" @click="handleAddWallpaperClick">
                            <img src="/iconfont/plus.svg" alt="">
                        </div>
                    </div>
                    <div v-for="(wallpaper, index) in wallpapers" :key="index"
                        @click="chooseWallpaper(wallpaper)"
                        :class="['wallpaper-box', {'is-selected': selectedWallpaper === wallpaper}]">
                        <img class="wallpaper-img" :ref="`wp${index}`" :src="wallpaper" alt="">
                        <img v-if="selectedWallpaper === wallpaper" class="selected-icon" src="/iconfont/selected-icon.svg" alt="">
                        <img src="/iconfont/delete-icon.svg" alt="" class="delete-wp icon" @click.stop="confirmDeleteWallpaper(wallpaper)">
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.appearance" name="appearance">
                <el-row>
                    <el-col :span="3">
                        <div class="appearance-items">
                            <div v-for="(apprItem, index) in appearanceItems" :key="index"
                                @click="handleApprItemClick(apprItem)"
                                :class="['appearance-item', {'is-active': curApprItem ? curApprItem.name === apprItem.name : false}]">
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
                                                <el-button type="primary" @click.native.prevent="handleThemeSave(themeMode)">{{i18nTexts.ui.settings.actions.applysave}}</el-button>
                                                <el-button type="warning" @click.native.prevent="handleThemeReset(themeMode)">{{i18nTexts.ui.settings.actions.reset}}</el-button>
                                            </div>
                                            <div class="theme-field-type">Background Coloring</div>
                                            <el-form-item v-if="themeMode === 'newtab'" label="New Tab:">
                                                <el-color-picker v-model="theme['--newtab-background-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="App:">
                                                <el-color-picker v-model="theme['--app-background-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Selected Search Suggestion:">
                                                <el-color-picker v-model="theme['--selected-suggestion-background-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Search Results Scrollbar:">
                                                <el-color-picker v-model="theme['--search-results-scrollbar-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>

                                            <div class="theme-field-type">Text Coloring</div>
                                            <el-form-item label="Search Input:">
                                                <el-color-picker v-model="theme['--search-input-value-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Selected Search Suggestion Title:">
                                                <el-color-picker v-model="theme['--selected-suggestion-title-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Selected Search Suggestion Subtitle:">
                                                <el-color-picker v-model="theme['--selected-suggestion-subtitle-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Search Suggestion Title:">
                                                <el-color-picker v-model="theme['--suggestion-title-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Search Suggestion Subtitle:">
                                                <el-color-picker v-model="theme['--suggestion-subtitle-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>
                                            <el-form-item label="Highlighted Suggestion Title:">
                                                <el-color-picker v-model="theme['--highlighted-suggestion-text-color']" :show-alpha="getColorType(themeMode)"></el-color-picker>
                                            </el-form-item>

                                            <div class="theme-field-type">Spacing</div>
                                            <el-form-item label="Search Results Scrollbar Width:">
                                                <el-input type="text" v-model="theme['--search-results-scrollbar-width']" spellcheck="false"></el-input>
                                            </el-form-item>

                                            <div class="theme-field-type">Text Sizing</div>
                                            <el-form-item label="Search Input:">
                                                <el-input type="text" v-model="theme['--search-input-value-text-size']" spellcheck="false"></el-input>
                                            </el-form-item>
                                            <el-form-item label="Search Suggestion Title:">
                                                <el-input type="text" v-model="theme['--suggestion-title-text-size']" spellcheck="false"></el-input>
                                            </el-form-item>
                                            <el-form-item label="Search Suggestion Subtitle:">
                                                <el-input type="text" v-model="theme['--suggestion-subtitle-text-size']" spellcheck="false"></el-input>
                                            </el-form-item>
                                        </el-form>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </el-col>
                </el-row>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.advanced" name="advanced">
                <el-collapse v-model="activeAdvancedName">
                    <el-collapse-item name="userData" :title="i18nTexts.ui.settings.blocks.exportimport">
                        <el-row>
                            <el-col :span="2">
                                <el-button @click="handleExportClick" type="primary">{{i18nTexts.ui.settings.actions.export}}</el-button>
                            </el-col>
                            <el-col :span="2">
                                <el-upload accept="text/json" action="/" :before-upload="handleBackupBeforeUpload">
                                    <el-button type="primary">{{i18nTexts.ui.settings.actions.import}}</el-button>
                                </el-upload>
                            </el-col>
                            <el-col :span="2">
                                <el-button @click="handleResetClick" type="danger">{{i18nTexts.ui.settings.actions.reset}}</el-button>
                            </el-col>
                        </el-row>
                    </el-collapse-item>
                    <el-collapse-item name="socialShare" :title="i18nTexts.ui.settings.blocks.socialshareconfig">
                        <el-table :data="socialNetworks" style="width: 100%">
                            <el-table-column prop="class" label="Icon Link" width="100">
                                <template slot-scope="scope">
                                    <img class="network-icon" :src="networksIconFormatter(scope.row, scope.column)" alt="">
                                </template>
                            </el-table-column>
                            <el-table-column prop="name" label="Name" width="180"> </el-table-column>
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
                    <el-collapse-item name="pluginEditor" :title="i18nTexts.ui.settings.blocks.plugineditor">
                        <div class="custom-plugins-container">
                            <el-row>
                                <el-col :span="6">
                                    <div class="custom-plugins">
                                        <div class="button-bar">
                                            <el-button type="primary" @click="handleCustomPluginClick()">New Plugin</el-button>
                                            <div class="plugin-item workflow-item" :class="{'is-selected': plugin === currentCustomPlugin}"
                                            v-for="(plugin, index) in customPlugins" :key="index" @click="handleCustomPluginClick(plugin)">
                                                <span class="plugin-name">{{plugin.name}}</span>
                                            </div>
                                        </div>
                                        <div class="custom-plugins-inner">
                                        </div>
                                    </div>
                                </el-col>
                                <el-col :span="18">
                                     <div class="code-editor" v-if="currentCustomPlugin">
                                         <codemirror v-model="currentCustomPlugin.source" :options="cmOptions"></codemirror>
                                         <div class="bts">
                                            <el-button type="primary" style="margin-top: 15px;" @click="handleCustomPluginSaveClick">Test and Save</el-button>
                                            <el-button v-if="currentCustomPlugin.id" type="warning" style="margin-top: 15px;" @click="handleCustomPluginDeleteClick">Remove</el-button>
                                         </div>
                                    </div>
                                </el-col>
                            </el-row>
                        </div>
                    </el-collapse-item>
                </el-collapse>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.help" name="help">
                <div class="text-panel">
                    <div v-if="activeName === 'help'" v-html="helpInfo"></div>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="i18nTexts.ui.settings.tabs.update" name="update">
                <div class="text-panel">
                    <h2>{{ extType }} v{{config.version}}</h2>
                    <section class="changelog">
                        <template v-for="(update, index) in changelog" v-if="!update.ext || update.ext === extType">
                            <div :key="index">
                                <h3 v-html="update.version"></h3>
                                <p v-html="update.detail"></p>
                            </div>
                        </template>
                    </section>
                    <div style="margin-top: 12px;">
                        <a style="margin-left: 12px;" :href="'http://static.oksteward.com/' + extType + '-' + config.version + '.crx'">{{i18nTexts.ui.settings.actions.downloadcrx}}</a>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>
        <el-dialog v-model="networkDialogVisible" title="Social Network Edit">
            <el-form ref="networkForm" :model="networkForm" :rules="networkRules">
                <el-form-item label="Name" prop="name">
                    <el-input v-model="networkForm.name" placeholder="Facebook"></el-input>
                </el-form-item>
                <el-form-item label="Icon" prop="class">
                    <el-input v-model="networkForm.class" placeholder="https://xxx.com/favicon.png"></el-input>
                </el-form-item>
                <el-form-item label="URL" prop="url">
                    <el-input v-model="networkForm.url" placeholder="https://www.xxx.com/sharer?url={url}&img={img}&title{title}&desc={desc}"></el-input>
                </el-form-item>
                <div>
                    <el-button type="primary" @click="handleNetworkSaveClick">Save</el-button>
                </div>
            </el-form>
        </el-dialog>
        <header class="topbar">
            <div class="links">
                <a href="https://github.com/solobat/steward" class="github" target="_blank">
                    <img src="/iconfont/github.svg" alt="">
                </a>
                <a href="http://bbs.oksteward.com" class="steward_bbs" target="_blank">
                    <img src="/iconfont/bbs.svg" alt="">
                </a>
                <a href="http://oksteward.com" class="steward" target="_blank">
                    <img src="/img/icon.png" alt="">
                </a>
            </div>
        </header>     
    </div>    
</template>

<script>
import WebsitesMixin from './mixins/websites'
import AdvancedMixin from './mixins/advanced'
import AppearanceMixin from './mixins/appearance'
import WallpapersMixin from './mixins/wallpapers'
import WorkflowsMixin from './mixins/workflows'
import PluginsMixin from './mixins/plugins'
import { helpInfo } from '../../js/info/help'
import changelog from '../../js/info/changelog'
import util from '../../js/common/util'
import * as i18n from '../../js/info/i18n'
import CONST from '../../js/constant'
const extType = EXT_TYPE === 'stewardlite' ? 'Steward Lite' : 'steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';

export default {
    name: 'app',
    props: ['config', 'i18nTexts', 'tabName'],
    data: function() {
        return {
            activeGeneralConfigName: ['command'],
            changelog,
            extType,
            storeId,
            helpInfo,
            activeName: this.$props.tabName,
            newtabWidgets: CONST.OPTIONS.NEWTAB_WIDGETS,
        }
    },

    watch: {
        tabName(newTabName) {
            this.activeName = newTabName;
        }
    },

    mounted: function() {
        if (this.activeName === 'update') {
            this.$nextTick(() => {
                this.saveConfig(true);
            });
        }
        this.initTab(this.activeName);
    },

    mixins: [
        WebsitesMixin,
        AdvancedMixin,
        AppearanceMixin,
        WallpapersMixin,
        WorkflowsMixin,
        PluginsMixin
    ],

    methods: {
        initTab(tabname) {
            if (tabname === 'wallpapers') {
                this.loadWallpapersIfNeeded();
            } else if (tabname === 'appearance') {
                if (!this.curApprItem) {
                    this.loadThemes().then(() => {
                        this.updateApprItem(this.appearanceItems[0]);
                    });
                } else {
                    this.applyTheme(this.themeMode);
                }
            } else if (tabname === 'workflows') {
                this.loadWorkflowsIfNeeded();
            } else if (tabname === 'advanced') {
                this.initAdvancedIfNeeded();
            }
        },
        handleTabClick: function(tab) {
            this.initTab(tab.name);
        },

        saveConfig: function(silent) {
            const that = this;
            const newConfig = JSON.parse(JSON.stringify(this.config));

            chrome.storage.sync.set({
                [CONST.STORAGE.CONFIG]: newConfig
            }, function() {
                if (silent) {
                    console.log('save successfully');
                } else {
                    that.$message(chrome.i18n.getMessage('save_ok'));
                }
            });
        },

        handleGeneralSubmit: function() {
            this.saveConfig();
        }
    }
}
</script>

<style lang="scss">
@import '../../scss/main.scss';
@import '../../scss/themes/popup/classical.scss';

[v-cloak] {
    display: none;
}

body,
p,
div,
ul,
li {
    margin: 0;
    padding: 0;
}

img {
    vertical-align: top;
}

a {
    text-decoration: none;
}

.topbar {
    display: none;
    width: 1200px;
    height: 40px;
    margin: 0 auto;
    overflow: hidden;

    .links {
        display: flex;
        height: 40px;
        align-items: center;
        float: right;

        a {
            display: block;
            margin: 0 10px;
            width: 30px;
            height: 30px;
        }

        img {
            width: 100%;
            height: 100%;
        }
    }
}

.steward {
    margin: 0 auto;

    .el-tab-pane {
        padding: 15px;
    }

    .main {
        box-sizing: border-box;
        margin: 0;
    
        * {
            box-sizing: inherit;
        }
    }

    .el-tabs__header,
    .el-collapse-item__header,
    .plugin-item,
    .el-form-item__label,
    .appearance-item {
        user-select: none;
    }
}

.steward .el-tabs__header {
    margin-bottom: 0;
}

.general-panel {
    .el-form-item {
        margin-bottom: 5px;
    }
}

.shortcuts-config {
    .el-input {
        width: 100px;
    }
}

.plugin-searchbar,
.button-bar {
    padding: 10px;
}

.plugin-list,
.plugin-editor {
    height: 600px;
    overflow-y: auto;
}

.bg-black {
    background: #333;
}

.plugin-item {
    cursor: pointer;
    padding: 3px 8px;
    height: 40px;
    position: relative;

    &.plugin-disabled {
        color: #999;
    }

    &.is-selected {
        color: #20a0ff;
    }
}

.workflow-item {
    display: flex;
    align-items: center;
}

.plugin-icon {
    width: 20px;
    height: 20px;
    float: left;
}

.plugin-name {
    margin-left: 5px;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 100;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &:hover {
        color: #20a0ff;
    }
}

.plugin-doc {
    margin-left: 12px;
    color: #20a0ff;

    &:hover {
        text-decoration: underline;
    }
}

.plugin-editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* editor */
.plugin-editor-header {
    display: flex;
    background: #333;
    height: 40px;
    padding: 12px;
}

.plugin-editor-config {
    flex: 1;
    background: rgb(230, 230, 230);
}

.plugin-editor-icon {
    width: 40px;
    height: 40px;
}

.plugin-editor-text {
    flex: 1;
    margin-left: 10px;
}

.plugin-editor-name {
    font-size: 14px;
    line-height: 1.6;
    color: #fff;
}

.plugin-editor-title {
    font-size: 12px;
    color: #999;
}

.icon-batch {
    width: 17px;
    vertical-align: -3px;
}

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
    height: 600px;
}

.themes-container {
    display: flex;
    height: 600px;
    padding: 15px;
    box-sizing: border-box;
}

.themes-info {
    font-size: 16px;
    color: #fff;
    text-align: center;
}

.theme-editor {
    flex: 1;
    margin-left: 15px;
    background: #333;
    color: #fff;
    height: 570px;
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

.changelog {
    padding: 5px 12px;
    height: 400px;
    border: 1px solid #ededed;
    overflow: scroll;
}

.text-panel {
    width: 740px;
    margin: 20px auto 0;
    color: rgba(51, 51, 51, 0.87);
    font-size: 16px;
    line-height: 1.6;
    border: 1px solid #ededed;
    padding: 15px 30px 25px;
}

.text-panel a {
    border-bottom: 1px solid #20a0ff;
    color: #20a0ff;
}

.text-panel .notice,
.text-panel em {
    color: #ff3f80;
    font-style: normal;
}

.text-panel .qrcode {
    box-shadow: 0 0 10px #555;
    border-radius: 6px;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10px;
    margin-bottom: 10px;
    width: 200px;
}

.text-panel .qrcodes {
    display: flex;
    justify-content: space-between;
}

.wallpaper-box {
    position: relative;
    width: 25%;
    padding: 5px;
    float: left;
    box-sizing: border-box;
}

.wallpaper-add-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f5f5f5;
    height: 135px;
    cursor: pointer;

    img {
        display: block;
        width: 50px;
        height: 50px;
    }
}

.wallpaper-box .wallpaper-img {
    display: block;
    position: relative;
    width: 100%;
    height: 135px;
    transition: transform .3s ease-out;
}

.wallpaper-box .selected-icon {
    width: 25px;
    height: 25px;
    position: absolute;
    right: 10px;
    bottom: 10px;
}

.wallpaper-box img:hover {
    transform: scale(1.1);
    z-index: 100;
}

.wallpaper-box .icon {
    display: none;
    position: absolute;
    width: 25px;
    height: 25px;
}

.wallpaper-box:hover .icon {
    display: block;
}

.wallpaper-box:hover .icon img {
    width: 100%;
    height: 100%;
    display: block;
}

.wallpaper-box .delete-wp {
    top: 10px;
    right: 10px;
    z-index: 101;
}

.wallpaper-box .download-wp {
    top: 45%;
    left: 45%;
}

.paths-container {
    .el-row {
        margin-top: 6px;
    }
}

.split {
    margin: 15px 0;
    border-bottom: 1px dotted #d1dbe5;
}

.network-icon {
    display: block;
    width: 25px;
    height: 25px;
}

.code-editor {
    .CodeMirror {
        height: 90vh;
    }
}
</style>
