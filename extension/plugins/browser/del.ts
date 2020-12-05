/**
 * @description delete extensions / apps by del command
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
  const name = 'deleteExtension';
  const key = 'del';
  const type = 'keyword';
  const icon = getURL('iconfont/del.svg');
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

  function uninstall(id, cb) {
    Steward.chrome.management.uninstall(id, function(...args) {
      Reflect.apply(cb, null, args);
    });
  }

  // get all
  function getExtensions(query, enabled, callback) {
    chrome.management.getAll(function(extList) {
      const matchExts = extList.filter(function(ext) {
        return util.matchText(query, ext.name);
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
        desc: item.description,
        isWarn: isWarn,
      };
    });
  }

  function onInput(query) {
    return new Promise(resolve => {
      getExtensions(query.toLowerCase(), false, function(matchExts) {
        resolve(dataFormat(matchExts));
      });
    });
  }

  function onEnter(item) {
    uninstall(item.id, () => {
      Steward.app.refresh();
    });
  }
  return {
    version,
    name: 'Delete Extension',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
