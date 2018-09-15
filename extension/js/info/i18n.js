
function getI18n(key) {
    return chrome.i18n.getMessage(key);
}

export const settings = {
    notion: {
        workflow: getI18n('settings_notion_workflow'),
        website: getI18n('settings_notion_website')
    },
    fields: {
        title: getI18n('settings_fields_title'),
        description: getI18n('settings_fields_description'),
        content: getI18n('settings_fields_content'),
        host: getI18n('settings_fields_host'),
        siteicon: getI18n('settings_fields_siteicon'),
        paths: getI18n('settings_fields_paths'),
        navigations: getI18n('settings_fields_navigations'),
        outlinescope: getI18n('settings_fields_outlinescope'),
        anchors: getI18n('settings_fields_anchors'),
        disable: getI18n('settings_fields_disable')
    },
    tabs: {
        general: getI18n('settings_tabs_general'),
        plugins: getI18n('settings_tabs_plugins'),
        workflows: getI18n('settings_tabs_workflows'),
        websites: getI18n('settings_tabs_websites'),
        wallpapers: getI18n('settings_tabs_wallpapers'),
        appearance: getI18n('settings_tabs_appearance'),
        advanced: getI18n('settings_tabs_advanced'),
        help: getI18n('settings_tabs_help'),
        update: getI18n('settings_tabs_update')
    },
    blocks: {
        commandsplugins: getI18n('settings_blocks_commandsplugins'),
        operationinteraction: getI18n('settings_blocks_operationinteraction'),
        websitesconfiguration: getI18n('settings_blocks_websitesconfiguration'),
        newtab: getI18n('settings_blocks_newtab'),
        performance: getI18n('settings_blocks_performance'),
        shortcutconfiguration: getI18n('settings_blocks_shortcutconfiguration'),
        websitebaseinfo: getI18n('settings_blocks_websitebaseinfo'),
        websitenav: getI18n('settings_blocks_websitenav'),
        inpagenav: getI18n('settings_blocks_inpagenav'),
        exportimport: getI18n('settings_blocks_exportimport'),
        socialshareconfig: getI18n('settings_blocks_socialshareconfig'),
        plugineditor: getI18n('settings_blocks_plugineditor')
    },
    actions: {
        save: getI18n('settings_actions_save'),
        delete: getI18n('settings_actions_delete'),
        newworkflow: getI18n('settings_actions_newworkflow'),
        newwebsite: getI18n('settings_actions_newwebsite'),
        applysave: getI18n('settings_actions_applysave'),
        reset: getI18n('settings_actions_reset'),
        'export': getI18n('settings_actions_export'),
        'import': getI18n('settings_actions_import'),
        downloadcrx: getI18n('settings_actions_downloadcrx')
    }
}
