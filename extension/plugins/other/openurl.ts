/**
 * @description open url in browser
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import urlRegex from 'url-regex';

import util from 'common/util';
import { Command, Plugin } from 'plugins/type';
import { StewardApp } from 'common/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome } = Steward;

  const version = 3;
  const name = 'openurl';
  const key = 'open';
  const type = 'regexp';
  const icon = getURL('iconfont/openurl.svg');
  const title = t(`${name}_title`);
  const subtitle = t(`${name}_subtitle`);
  const regExp: RegExp = urlRegex({ exact: true, strict: false });

  regExp.formatter = (query: string) => query.replace(/。/g, '.')
  
  const commands: Command[] = [
    {
      key,
      title,
      type,
      subtitle,
      icon,
      editable: false,
      regExp,
    },
  ];

  function onInput(url) {
    const data = [
      {
        key: 'url',
        id: name,
        icon,
        title: regExp.formatter(url),
        desc: subtitle,
        url,
      },
    ];

    return data;
  }

  function onEnter(item, command, query, keyStatus) {
    const { url } = item;
    let theurl = url;

    if (!/^https?/.test(url)) {
      theurl = `http://${url}`;
    }
    util.createTab({ url: theurl }, keyStatus);
  }

  return {
    version,
    name: 'Open Url',
    category: 'other',
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false,
  };
}
