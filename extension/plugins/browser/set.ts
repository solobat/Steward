/**
 * @description open extension's option page
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { StewardApp } from 'common/type';
import util from 'common/util';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import { Command, Plugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 2;
  const name = 'setOption';
  const key = 'set';
  const type = 'keyword';
  const icon = getURL('iconfont/set.svg');
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

  function openOptionPage(item, keyStatus) {
    const url = item.url;

    if (!url) {
      return;
    }

    util.createTab({ url: url }, keyStatus);
  }

  // get all
  function getExtensions(query, enabled, callback) {
    chrome.management.getAll(function(extList) {
      const matchExts = extList.filter(function(ext) {
        return (
          !ext.isApp &&
          ext.enabled === enabled &&
          util.matchText(query, ext.name)
        );
      });

      callback(matchExts);
    });
  }

  function dataFormat(rawList) {
    return rawList.map(function(item) {
      const url =
        item.icons instanceof Array
          ? item.icons[item.icons.length - 1].url
          : '';
      const isWarn = item.installType === 'development';

      return {
        key,
        id: item.id,
        icon: url,
        title: item.name,
        url: item.optionsUrl,
        desc: item.description,
        isWarn,
      };
    });
  }
  function onInput(query) {
    return new Promise(resolve => {
      getExtensions(query.toLowerCase(), true, function(matchExts) {
        resolve(dataFormat(matchExts));
      });
    });
  }

  function onEnter(item, command, query, keyStatus) {
    openOptionPage(item, keyStatus);
  }

  return {
    version,
    name: 'Set Extension',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
