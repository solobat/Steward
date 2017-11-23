import browser from 'webextension-polyfill'
import $ from 'jquery'
import { plugins as pluginList } from '../plugins/browser'
import _ from 'underscore'
import defaultGeneral from '../conf/general'
import util from './util'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const pluginModules = _.sortBy(pluginList.filter(item => item.commands), 'name').map(plugin => {
    const {name, icon, commands, title} = plugin;

    return {
        name,
        version: plugin.version,
        commands: commands.map(util.simpleCommand),
        title,
        icon
    }
});

function getPluginData() {
    const plugins = {};

    pluginModules.forEach(plugin => {
        mergePluginData(plugin, plugins);
    });

    return plugins;
}

function mergePluginData(plugin, plugins) {
    const pname = plugin.name;
    const cachePlugin = plugins[pname];

    if (!cachePlugin) {
        plugins[pname] = {
            version: plugin.version,
            commands: plugin.commands
        };
    } else {
        if (!cachePlugin.version) {
            cachePlugin.version = 1;
        }

        if (plugin.version > cachePlugin.version) {
            // rough merge
            cachePlugin.commands = $.extend(true, plugin.commands, cachePlugin.commands);
            cachePlugin.version = plugin.version;
        }
    }

    // Reduce the cache usage
    cachePlugin.commands = cachePlugin.commands.map(util.simpleCommand);
}

// get merged config && save if needed
export function getSyncConfig(save, keepVersion) {
    return browser.storage.sync.get('config').then(res => {
        let config;

        if (res.config) {
            config = res.config;
            config.general = $.extend({}, defaultGeneral, config.general);
            // 总是确保数据是最新的
            pluginModules.forEach(plugin => {
                mergePluginData(plugin, config.plugins);
            });
            if (!keepVersion) {
                config.version = version;
            }
        } else {
            config = {
                general: defaultGeneral,
                plugins: getPluginData(),
                version
            };
        }
        console.log(config);

        if (save) {
            browser.storage.sync.set({
                config
            });
        }

        return config;
    });
}

export function restoreConfig() {
    const config = {
        general: defaultGeneral,
        plugins: getPluginData(),
        version
    };

    return browser.storage.sync.set({
        config
    });
}