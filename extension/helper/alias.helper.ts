import { browser } from 'webextension-polyfill-ts';

import util from 'common/util';
import { ResultItem } from 'plugins/type';
import { getURL } from './extension.helper';

const icon = getURL('iconfont/alias.svg');

function format(list) {
  return list.map(item => {
    return {
      key: 'url',
      url: item.value,
      title: `${item.desc || item.value}[${item.label}]`,
      desc: item.lable,
      icon,
      weight: 100,
    };
  });
}

let comment;

function parseLine(line) {
  const realLine = line.trim();

  if (realLine.startsWith('##')) {
    comment = realLine.substring(2).trim();

    return null;
  } else {
    const parts = realLine.split(/[\s]+/).slice(0, 2);
    const desc = comment;

    comment = null;

    return {
      label: parts[0],
      value: parts[1],
      desc,
    };
  }
}

const STORAGE_KEY = 'text_alias';

export const TextAlias = {
  items: null,

  resolveItems(text) {
    return text
      .split('\n')
      .filter(line => line && !line.match(/^[\s\t]+$/))
      .map(parseLine)
      .filter(line => line && Boolean(line.label));
  },

  getItems() {
    if (this.items) {
      return Promise.resolve(this.items);
    } else {
      return browser.storage.sync.get(STORAGE_KEY).then(resp => {
        const text = resp[STORAGE_KEY];

        if (text) {
          const items = this.resolveItems(text);

          this.items = items;

          return items;
        } else {
          return [];
        }
      });
    }
  },

  onInput(query): Promise<ResultItem[]> | ResultItem[] {
    return this.getItems().then(items => {
      if (items && items.length) {
        return format(util.getMatches(items, query, 'label') || []);
      } else {
        return [];
      }
    });
  },
};

export type TextAliasType = typeof TextAlias;

export function getTextAlias() {
  return browser.storage.sync.get(STORAGE_KEY).then(resp => {
    return resp[STORAGE_KEY] || '';
  });
}

export function saveTextAlias(text) {
  return browser.storage.sync.set({
    [STORAGE_KEY]: text,
  });
}
