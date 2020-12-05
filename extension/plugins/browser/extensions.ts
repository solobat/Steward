/**
 * @description extensions
 * @author tomasy
 * @email solopea@gmail.com
 */

/*global EXT_TYPE */
import { StewardApp } from 'common/type';
import util from 'common/util';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import { Command, Plugin, ResultItem } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 2;
  const name = 'viewExtension';
  const key = 'ext';
  const type = 'keyword';
  const icon = getURL('iconfont/viewext.svg');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
  const commands: Command[] = [
    {
      key,
      type,
      title,
      subtitle,
      icon,
      shiftKey: true,
      editable: true,
    },
  ];
  const extType = EXT_TYPE === 'stewardplus' ? 'Steward Plus' : 'Steward';

  function getExtensions(query, callback) {
    chrome.management.getAll(function(extList) {
      const data = extList.filter(function(ext) {
        return util.matchText(query, ext.name);
      });

      callback(data);
    });
  }

  function dataFormat(rawList, command) {
    let wrapDesc;

    if (command.shiftKey) {
      wrapDesc = util.wrapWithMaxNumIfNeeded('description', 1000);
    }

    return rawList.map(function(item, i) {
      const url = item.icons instanceof Array ? item.icons[0].url : '';
      const isWarn = item.installType === 'development';
      let desc = item.description;

      if (wrapDesc) {
        desc = wrapDesc(item, i);
      }

      return {
        key: key,
        id: item.id,
        icon: url,
        title: item.name,
        desc,
        homepage: item.homepageUrl,
        isWarn: isWarn,
      };
    });
  }

  function onInput(query, command) {
    if (query === '/') {
      return `${command.key} ${extType}`;
    } else {
      return new Promise(resolve => {
        getExtensions(query.toLowerCase(), function(data) {
          resolve(dataFormat(data, command));
        });
      });
    }
  }

  function onEnter(item: ResultItem, command, query, keyStatus) {
    const { id, homepage } = item;

    if (keyStatus.shiftKey && homepage) {
      util.createTab({ url: homepage }, keyStatus);
    } else {
      util.createTab({ url: `chrome://extensions/?id=${id}` }, keyStatus);
    }
  }

  return {
    version,
    name: 'View Extension',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
