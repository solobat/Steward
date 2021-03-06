/**
 * @description Steward package manager
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { StewardApp } from 'common/type';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import { customPluginHelper, getCustomPlugins, pluginFactory } from 'helper/plugin.helper';
import { Command, Plugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome, axios, dayjs, util, constant } = Steward;

  const version = 1;
  const name = 'spm';
  const type = 'keyword';
  const icon = getURL('img/icon.png');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
  const commands: Command[] = [
    {
      key: 'spm',
      type,
      title,
      subtitle,
      icon,
    },
  ];

  const platform = PLATFORM || 'chrome';
  const subCommandKeys = ['install', 'uninstall', 'list'];
  const subCommands = subCommandKeys.map(item => {
    return {
      key: 'plugins',
      universal: true,
      id: `spm ${item}`,
      icon,
      title: t(`${name}_${item}_title`),
      desc: t(`${name}_${item}_subtitle`),
    };
  });
  const LIST_URL =
    'https://raw.githubusercontent.com/Steward-launcher/steward-plugins/master/data.json';

  let plugins;

  function filterPlugins(list, query) {
    if (query) {
      return list.filter(item => {
        return util.matchText(query, item.name + item.title);
      });
    } else {
      return list;
    }
  }

  function queryPlugins(query) {
    if (plugins) {
      return Promise.resolve(filterPlugins(plugins, query));
    } else {
      return axios
        .get(LIST_URL, {
          params: {
            t: dayjs().format('YYYYMMDD'),
          },
        })
        .then(results => {
          const items = results.data.plugins;

          plugins = items.filter(
            item => util.isPlatform(item.platform),
          );

          return filterPlugins(plugins, query);
        });
    }
  }

  function getStatusText(item) {
    const status = customPluginHelper.checkPluginStatus(item);

    if (status === constant.BASE.PLUGIN_STATUS.INSTALLED) {
      return '✓';
    } else if (status === constant.BASE.PLUGIN_STATUS.NEWVESION) {
      return '↑';
    }
  }

  function dataFormat(list, subcmd) {
    return list.map(item => {
      let desc = `${item.title} -- by ${item.author}`;

      if (subcmd === 'install') {
        const result = getStatusText(item);

        if (result) {
          desc = `${result} ${desc}`;
        }
      }

      return {
        id: item._id,
        icon: item.icon,
        title: item.name,
        desc,
        source: item.source,
        subcmd,
      };
    });
  }

  function queryInstalledPlugins(query) {
    return getCustomPlugins().then(list => {
      return filterPlugins(list, query);
    });
  }

  function onInput(query) {
    const cmdstr = query.trim();
    const arr = cmdstr.split(' ');
    const subcmd = arr[0];
    const subquery = arr[1] || '';

    if (subCommandKeys.includes(subcmd)) {
      if (subcmd === 'list' || subcmd === 'install') {
        return queryPlugins(subquery).then(list => {
          return dataFormat(list, subcmd);
        });
      } else {
        return queryInstalledPlugins(subquery).then(list => {
          return dataFormat(list, subcmd);
        });
      }
    } else {
      return Promise.resolve(
        subCommands.filter(cmd => cmd.id.indexOf(query) !== -1),
      );
    }
  }

  function installPlugin(item) {
    return axios
      .get(item.source, {
        params: {
          t: Number(new Date()),
        },
      })
      .then(results => {
        const resp = results.data;
        const plugin = pluginFactory({
          source: resp,
        });
        let result: any = true;

        if (plugin) {
          const meta = plugin.getMeta();
          const status = customPluginHelper.checkPluginStatus(meta);

          if (status === constant.BASE.PLUGIN_STATUS.NOTINSTALL) {
            result = customPluginHelper.create(meta);
            util.toast.success('Plugin has been installed successfully!');
          } else if (status === constant.BASE.PLUGIN_STATUS.NEWVESION) {
            result = customPluginHelper.update(meta);
            util.toast.success('Plugin has been updated successfully!');
          } else {
            util.toast.warning('Plugin has been installed');
          }
        } else {
          util.toast.error('Plugin is broken!');
        }

        return result;
      });
  }

  function uninstallPlugin(item) {
    customPluginHelper.remove(item.id);
    util.toast.success('Uninstall successfully!');

    return Promise.resolve('spm uninstall');
  }

  function onEnter(item) {
    const subcmd = item.subcmd;

    if (subcmd === 'install') {
      return installPlugin(item).then(() => {
        Steward.app.refresh();

        return true;
      });
    } else if (subcmd === 'uninstall') {
      return uninstallPlugin(item).then(() => {
        Steward.app.refresh();

        return true;
      });
    }
  }

  return {
    version,
    name: 'Steward Package Manager',
    category: 'steward',
    type,
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false,
  };
}
