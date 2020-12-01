import $ from 'jquery';
import _ from 'underscore';
import { browser } from 'webextension-polyfill-ts';

import defaultGeneral from 'conf/general';
import { getPlugins } from 'plugins';
import { Plugin } from 'plugins/type';

import util, { SimpleCommand } from './util';

export type PartialPlugin = Pick<
  Plugin,
  'name' | 'version' | 'canDisabled' | 'icon' | 'disabled'
> & {
  commands: SimpleCommand[];
};

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

function getPluginModules() {
  const pluginModules: PartialPlugin[] = _.sortBy(
    getPlugins(window.Steward).filter(item => item.commands),
    'name',
  ).map(plugin => {
    const { name, icon, commands, title, canDisabled } = plugin;
    let simpleCommands: SimpleCommand[];

    if (commands) {
      simpleCommands = commands.map(util.simpleCommand);
    }

    return {
      name,
      version: plugin.version,
      commands: simpleCommands,
      title,
      icon,
      canDisabled,
    } as PartialPlugin;
  });

  return pluginModules;
}

function getPluginData() {
  const plugins: PluginsData = {};

  getPluginModules().forEach(plugin => {
    mergePluginData(plugin, plugins);
  });

  return plugins;
}

export interface PluginsData {
  [prop: string]: PartialPlugin;
}

function mergePluginData(plugin: PartialPlugin, cachePlugins: PluginsData) {
  const name = plugin.name;
  let cachePlugin = cachePlugins[name];

  if (cachePlugin) {
    if (!cachePlugin.version) {
      cachePlugin.version = 1;
    }

    // rough merge
    cachePlugin.commands = $.extend(
      true,
      plugin.commands,
      cachePlugin.commands,
    );
    cachePlugin.version = plugin.version;

    if (plugin.canDisabled) {
      cachePlugin.disabled = cachePlugin.disabled || false;
    }
  } else {
    cachePlugins[name] = {
      version: plugin.version,
      commands: plugin.commands,
    } as PartialPlugin;
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

export interface AppConfig {
  general: typeof defaultGeneral;
  plugins: PluginsData;
  version: string;
}

function getDefaultConfig() {
  return {
    general: defaultGeneral,
    plugins: getPluginData(),
    version,
  } as AppConfig;
}

// get merged config && save if needed
export function getSyncConfig(save, keepVersion) {
  return browser.storage.sync.get('config').then(res => {
    let config;

    if (res.config) {
      config = res.config;
      config.general = $.extend({}, defaultGeneral, config.general);

      getPluginModules().forEach(plugin => {
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
        config,
      });
    }

    return config as AppConfig;
  });
}

export function restoreConfig() {
  const config = getDefaultConfig();

  return browser.storage.sync.set({
    config,
  });
}
