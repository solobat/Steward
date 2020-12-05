/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { StewardApp } from 'common/type';
import util from 'common/util';
import { stewardPlusTabs, stewardTabs } from 'constant/base';
import { Plugin } from 'plugins/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 1;
  const name = 'steward';
  const type = 'search';
  const icon = getURL('img/icon.png');
  const title = t(`${name}_title`);
  const baseUrl = getURL('options.html');

  let optionTabs;

  if (EXT_TYPE === 'stewardplus') {
    optionTabs = stewardPlusTabs;
  } else {
    optionTabs = stewardTabs;
  }

  optionTabs.push('Backup');

  function caseFormat(str) {
    return str[0].toUpperCase() + str.slice(1);
  }

  function onInput(text) {
    const filterByName = suggestions => util.getMatches(suggestions, text);
    const extType = caseFormat(EXT_TYPE);
    const mapTo = itemType => item => {
      const isBackup = item === 'Backup';

      return {
        icon,
        key: isBackup ? 'app' : itemType,
        title: item,
        url: item === extType ? baseUrl : `${baseUrl}#/${item.toLowerCase()}`,
        weight: 2,
      };
    };

    const tabs = filterByName(optionTabs).map(mapTo('url'));

    return Promise.resolve(tabs);
  }

  function onEnter() {}

  return {
    version,
    name: 'Steward',
    category: 'steward',
    type,
    icon,
    title,
    onInput,
    onEnter,
    canDisabled: false,
  };
}
