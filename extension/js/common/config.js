import browser from 'webextension-polyfill'
import $ from 'jquery'
import { plugins as pluginList } from '../plugins'
import _ from 'underscore'
import defaultGeneral from '../conf/general'
import util from './util'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const pluginModules = _.sortBy(pluginList.filter(item => item.commands), 'name').map(plugin => {
    const {name, icon, commands, title, canDisabled} = plugin;
    let simpleCommand;

    if (commands) {
        simpleCommand = commands.map(util.simpleCommand);
    }

    return {
        name,
        version: plugin.version,
        commands: simpleCommand,
        title,
        icon,
        canDisabled
    }
});

function getPluginData() {
    const plugins = {};

    pluginModules.forEach(plugin => {
        mergePluginData(plugin, plugins);
    });

    return plugins;
}

function mergePluginData(plugin, cachePlugins) {
    const name = plugin.name;
    let cachePlugin = cachePlugins[name];

    if (cachePlugin) {
        if (!cachePlugin.version) {
            cachePlugin.version = 1;
        }

        // rough merge
        cachePlugin.commands = $.extend(true, plugin.commands, cachePlugin.commands);
        cachePlugin.version = plugin.version;

        if (plugin.canDisabled) {
            cachePlugin.disabled = cachePlugin.disabled || false;
        }
    } else {
        cachePlugins[name] = {
            version: plugin.version,
            commands: plugin.commands
        };
        cachePlugin = cachePlugins[name];

        if (plugin.canDisabled) {
            cachePlugin.disabled = false;
        }
    }

    // Reduce the cache usage because of the limitation of chrome.storage.sync api
    if (cachePlugin && cachePlugin.commands) {
        cachePlugin.commands = cachePlugin.commands.map(util.simpleCommand);
    }
}

function getDefaultConfig() {
    return {
        general: defaultGeneral,
        plugins: getPluginData(),
        version
    };
}

// get merged config && save if needed
export function getSyncConfig(save, keepVersion) {
    return browser.storage.sync.get('config').then(res => {
        let config;

        if (res.config) {
            config = res.config;
            config.general = $.extend({}, defaultGeneral, config.general);

            pluginModules.forEach(plugin => {
                mergePluginData(plugin, config.plugins);
            });

            // because of update tab
            if (!keepVersion) {
                config.version = version;
            }
        } else {
            config = getDefaultConfig();
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
    const config = getDefaultConfig();

    return browser.storage.sync.set({
        config
    });
}