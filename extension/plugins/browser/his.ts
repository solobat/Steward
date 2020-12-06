/**
 * @description find in history
 * @author tomasy
 * @email solopea@gmail.com
 */

import { JSONSchema4, JSONSchema4Object } from 'json-schema';

import { StewardApp } from 'common/type';
import { getURL } from 'helper/extension.helper';
import { t } from 'helper/i18n.helper';
import { Command, Plugin } from 'plugins/type';

const timerangeTypes = ['today', 'week', 'month', 'year']
const optionsSchema: JSONSchema4 = {
  type: 'object',
  properties: {
    timerange: {
      type: 'string',
      enum: [...timerangeTypes]
    }
  }
}
function getDefaultOptions(): JSONSchema4Object {
  return {
    timerange: 'today'
  }
}

function history(Steward: StewardApp, opt?: JSONSchema4Object): Plugin {
  const { chrome, util } = Steward;
  const options = Object.assign(getDefaultOptions(), opt || {})

  const version = 4;
  const name = 'history';
  const key = 'his';
  const type = 'keyword';
  const icon = getURL('iconfont/history.svg');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
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

  function getStartTime() {
    const dayDiffs = [1, 7, 30, 365]
    const diff = dayDiffs[timerangeTypes.indexOf(options.timerange as string)]
    
    return Number(Steward.dayjs().subtract(diff, 'day').toDate());
  }
  
  function searchHistory(query, callback) {
    chrome.history.search(
      {
        text: query,
        startTime: getStartTime()
      },
      function(data) {
        let hisList = data || [];

        hisList = hisList.filter(function(his) {
          return Boolean(his.title);
        });

        callback(hisList);
      },
    );
  }

  function dataFormat(rawList, command) {
    let wrapDesc;

    if (command.shiftKey) {
      wrapDesc = util.wrapWithMaxNumIfNeeded('url');
    }

    return rawList.map(function(item, i) {
      let desc = item.url;

      if (wrapDesc) {
        desc = wrapDesc(item, i);
      }
      return {
        key: key,
        id: item.id,
        icon: icon,
        title: item.title,
        desc,
        url: item.url,
      };
    });
  }

  function onInput(query, command) {
    if (query === '/' && window.parentHost) {
      return `${command.key} ${window.parentHost}`;
    } else {
      return new Promise(resolve => {
        searchHistory(query, function(matchUrls) {
          resolve(dataFormat(matchUrls, command));
        });
      });
    }
  }

  function onEnter(item, command, query, { shiftKey }, list) {
    util.batchExecutionIfNeeded(shiftKey, util.tabCreateExecs, [list, item]);
    return Promise.resolve('');
  }

  return {
    version,
    name: 'History',
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false,
    optionsSchema,
    defaultOptions: getDefaultOptions()
  };
}

history.displayName = 'History'

export default history