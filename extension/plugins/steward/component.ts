/**
 * @description components manager
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from 'common/util';
import { componentHelper, getComponentsConfig } from 'helper/component.helper';
import { Plugin } from 'plugins/type';

const version = 1;
const name = 'component';
const keys = [{ key: 'show' }, { key: 'hide' }];
const type = 'keyword';
const icon = chrome.extension.getURL('img/icon.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);

function dataFormatter(item) {
  const { title, subtitle, icon: theIcon, id } = item.meta;
  return {
    key: 'component',
    title,
    desc: subtitle,
    icon: theIcon || icon,
    id,
  };
}

function onInput(key, command) {
  const isShow = command.orkey === 'show';

  return getComponentsConfig().then(list => {
    const items = list.filter(item => item.show === !isShow).map(dataFormatter);
    const matched = key ? util.getMatches(items, key, 'title') : items;

    return matched;
  });
}

function onEnter(item, command) {
  const { orkey } = command;
  const isShow = orkey === 'show';
  const { id } = item;

  return componentHelper
    .update({
      id,
      show: isShow,
    })
    .then(() => {
      window.Steward.app.refresh();
    });
}

export default {
  version,
  name: 'Components Manager',
  category: 'other',
  icon,
  title,
  commands,
  onInput,
  onEnter,
  canDisabled: false,
} as Plugin;
