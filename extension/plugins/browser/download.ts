/**
 * @description download
 * @author tomasy
 * @email solopea@gmail.com
 * @usage enter to open file in folder or pause/resume task
 *        metaKey + enter to cancel
 *        shiftKey + enter to open url
 */

import { StewardApp } from 'common/type';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import { Command, Plugin } from 'plugins/type';

export default function(Steward: StewardApp): Plugin {
  const { chrome, util } = Steward;

  const version = 2;
  const name = 'download';
  const key = 'dl';
  const type = 'keyword';
  const icon = getURL('iconfont/download.svg');
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

  let timer = 0;
  const QUERY_DELAY = 200;

  function searchDownload(query, callback) {
    clearTimeout(timer);

    timer = window.setTimeout(function() {
      chrome.downloads.search(
        {
          query: query ? [query] : [],
          limit: 10,
        },
        function(data) {
          const downloadList = data || [];

          callback(downloadList);
        },
      );
    }, QUERY_DELAY);
  }

  const rFilename = /(?!\/)[^/]+\.?(\w+)?$/;

  function getItemTitle(item) {
    const filename = item.filename.match(rFilename)[0];
    let extraInfo = '';

    if (item.state === 'in_progress') {
      const pausedInfo = item.paused ? 'paused' : 'downloading';

      extraInfo = `/ [${((item.bytesReceived / item.totalBytes) * 100).toFixed(
        2,
      )}%] / [${pausedInfo}]`;
    } else if (item.state === 'interrupted') {
      extraInfo = '[interrupted]';
    }

    return `${filename} ${extraInfo}`;
  }

  function getItemDesc(item) {
    const size = (item.fileSize / 1024 / 1024).toFixed(2);
    const endTime = new Date(item.endTime).toLocaleString();

    return `${size}Mb / ${endTime} / ${item.url}`;
  }

  function onInput(query) {
    return new Promise(resolve => {
      searchDownload(query, function(downloadList) {
        const arr = [];
        let i;

        for (i in downloadList) {
          const item = downloadList[i];

          if (!item.filename) {
            continue;
          }

          arr.push({
            key,
            id: item.id,
            icon: icon,
            url: item.url,
            title: getItemTitle(item),
            desc: getItemDesc(item),
            paused: item.paused,
            state: item.state,
            filename: item.filename.match(rFilename)[0],
            isWarn: item.paused && item.state === 'in_progress',
          });
        }

        resolve(arr);
      });
    });
  }

  function onEnter(item, command, query, keyStatus) {
    if (item.state === 'in_progress') {
      if (keyStatus.metaKey) {
        chrome.downloads.cancel(item.id);
        util.toast.info(`[${item.filename}] has been canceled`);
      } else {
        if (item.paused) {
          chrome.downloads.resume(item.id);
          util.toast.info(`[${item.filename}] has been resumed`);
        } else {
          chrome.downloads.pause(item.id);
          util.toast.info(`[${item.filename}] has been paused`);
        }
      }
      Steward.app.refresh();
    } else {
      if (keyStatus.shiftKey) {
        util.createTab(item);
      } else {
        chrome.downloads.show(item.id);
      }
    }
  }

  return {
    version,
    name: 'Downloads',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
