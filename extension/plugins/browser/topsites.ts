/**
 * @description list the most visit websites
 * @author tomasy
 * @email solopea@gmail.com
 */

import { StewardApp } from 'commmon/type';
import util from 'common/util';
import { Command, Plugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 4;
  const name = 'topsites';
  const key = 'site';
  const type = 'keyword';
  const icon = chrome.extension.getURL('iconfont/topsites.svg');
  const title = chrome.i18n.getMessage(`${name}_title`);
  const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
  const commands: Command[] = [
    {
      key,
      type,
      title,
      subtitle,
      icon,
      allowBatch: true,
      shiftKey: true,
      editable: true,
    },
  ];

  function onInput() {
    return new Promise(resolve => {
      chrome.topSites.get(sites => {
        const arr = [];
        const wrapDesc = util.wrapWithMaxNumIfNeeded('url');
        let i;

        for (i in sites) {
          const item = sites[i];
          const desc = wrapDesc(item, i);
          arr.push({
            key,
            id: item.url,
            icon: icon,
            url: item.url,
            title: item.title,
            desc,
            isWarn: false,
          });
        }

        resolve(arr);
      });
    });
  }

  function onEnter(item, command, query, { shiftKey }, list) {
    util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
    return Promise.resolve('');
  }

  return {
    version,
    name: 'Top Sites',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
