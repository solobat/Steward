/**
 * @description todo
 * @author tomasy
 * @email solopea@gmail.com
 */

import { StewardApp } from 'commmon/type';
import ItemsStorage from 'helper/storage.helper';
import { Command, Plugin, ResultItem, StewardPlugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 1;
  const name = 'random';
  const key = 'random';
  const type = 'keyword';
  const icon = chrome.extension.getURL('iconfont/random.svg');
  const title = chrome.i18n.getMessage(`${name}_title`);
  const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
  const randomStorage = new ItemsStorage('Random Commands', 'randomCmds', true);
  const commands: Command[] = [
    {
      key,
      type,
      title,
      subtitle,
      icon,
      editable: true,
    },
  ];

  const defaultResult: ResultItem[] = [
    {
      icon,
      title,
      desc: subtitle,
    },
  ];

  function switch2randomMode() {
    chrome.runtime.sendMessage({
      action: 'saveConfig',
      data: {
        general: {
          cacheLastCmd: false,
          defaultPlugin: 'Random',
        },
      },
    });
  }

  function onInput(query) {
    if (!query) {
      switch2randomMode();

      return randomStorage.getItems().then((resp = []) => {
        return dataFormat(resp);
      });
    } else {
      return Promise.resolve(defaultResult);
    }
  }

  function onEnter(item, command, query) {
    if (query) {
      return randomStorage.addItem(query).then(() => {
        return `${command.key} `;
      });
    } else {
      return randomStorage.removeItem(item.id).then(() => {
        Steward.app.refresh();
      });
    }
  }

  function dataFormat(rawList = []) {
    const desc = chrome.i18n.getMessage('random_remove_subtitle');

    return rawList.map(function(item) {
      return {
        key: key,
        id: item,
        icon: icon,
        title: `[${item}]`,
        desc,
      } as ResultItem;
    });
  }

  function getOneCommand(): Promise<string> {
    return randomStorage.getItems().then(items => {
      if (items && items.length) {
        return items[Math.floor(Math.random() * items.length)];
      } else {
        return '';
      }
    });
  }

  return {
    version,
    name: 'Random Commands',
    category: 'steward',
    icon,
    title,
    commands,
    getOneCommand,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
