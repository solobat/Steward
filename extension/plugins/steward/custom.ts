/**
 * @description cusotm the newTab default command
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { Command, Plugin } from 'plugins/type';
import { StewardApp } from 'common/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome, Toast } = Steward;

  const version = 1;
  const name = 'custom';
  const key = 'custom';
  const type = 'keyword';
  const icon = getURL('img/icon.png');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
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
      Toast.success(t('save_ok'));
    } else {
      Toast.warning(t('custom_warning_notempty'));
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
