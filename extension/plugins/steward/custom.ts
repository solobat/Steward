/**
 * @description cusotm the newTab default command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import Toast from 'toastr';

import { PLUGIN_TYPE } from 'constant/base';
import { Command, Plugin } from 'plugins/type';
import { StewardApp } from 'commmon/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 1;
  const name = 'custom';
  const key = 'custom';
  const type = 'keyword';
  const icon = chrome.extension.getURL('img/icon.png');
  const title = chrome.i18n.getMessage(`${name}_title`);
  const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
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

  function onInput() {
    return [
      {
        key,
        title,
        desc: subtitle,
        icon,
      },
    ];
  }

  function onEnter(item, command, query) {
    if (query) {
      chrome.runtime.sendMessage({
        action: 'saveConfig',
        data: {
          general: {
            cacheLastCmd: false,
            defaultPlugin: 'Other',
            customCmd: query,
          },
        },
      });
      Steward.app.applyCommand(query);
      Toast.success(chrome.i18n.getMessage('save_ok'));
    } else {
      Toast.warning(chrome.i18n.getMessage('custom_warning_notempty'));
    }
  }

  return {
    version,
    name: 'Custom',
    category: 'steward',
    type,
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
