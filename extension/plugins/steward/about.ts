/**
 * @description about steward
 * @author tomasy
 * @email solopea@gmail.com
 */

import { StewardApp } from 'common/type';
import { getAboutLinks, getUpLinks } from 'info/links';
import { Plugin } from 'plugins/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome, util } = Steward;

  const version = 1;
  const name = 'about';
  const keys = [
    { key: 'about', shiftKey: true, allowBatch: true, editable: false },
    { key: 'up', shiftKey: true, allowBatch: true, editable: false },
  ];
  const type = 'keyword';
  const icon = getURL('img/icon.png');
  const title = t(`${name}_title`);
  const commands = util.genCommands(name, icon, keys, type);
  const lang = chrome.i18n.getUILanguage().indexOf('zh') > -1 ? 'zh' : 'en';
  const aboutLinks = getAboutLinks(lang);
  const upLinks = getUpLinks(lang);

  function dataFormat(list, command?: any) {
    const wrapDesc = util.wrapWithMaxNumIfNeeded('desc');

    return list.map((item, i) => {
      const desc = wrapDesc(item, i);
      return {
        key: 'plugins',
        title: item.title,
        icon: item.icon || icon,
        desc,
        url: item.url,
      };
    });
  }

  function onInput(query, command) {
    return new Promise(resolve => {
      if (command.orkey === 'about') {
        resolve(dataFormat(aboutLinks, command));
      } else {
        resolve(dataFormat(upLinks, command));
      }
    });
  }

  function onEnter(item, command, query, { shiftKey }, list) {
    util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
  }

  return {
    version,
    name: 'About Steward',
    category: 'steward',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
