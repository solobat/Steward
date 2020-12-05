import URLSearchParams from '@ungap/url-search-params';
import fuzzaldrinPlus from 'fuzzaldrin-plus';
import pinyin from 'pinyin';
import Toast from 'toastr';

import { QUOTA_BYTES_PER_ITEM } from 'constant/number';
import { Command, KeyStatus, ResultItem, Type } from 'plugins/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

function getPinyin(name: string): string {
  return pinyin(name, {
    style: pinyin.STYLE_NORMAL,
  }).join('');
}

function matchText(key: string, str: string): boolean {
  const text = getPinyin(str.toLowerCase());

  if (!key || str.indexOf(key) > -1 || text.indexOf(key) > -1) {
    return true;
  } else {
    const plainKey = key.replace(/\s/g, '');
    const keys = plainKey.split('').join('.*');
    const reg = new RegExp(`.*${keys}.*`);

    return reg.test(text);
  }
}

const isMac = navigator.platform === 'MacIntel';

function guid(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

export type SimpleCommand = Pick<Command, 'key' | 'orkey'>;

const simpleCommand = (command: Command) => {
  return {
    key: command.key,
    orkey: command.orkey,
  } as SimpleCommand;
};

function genCommands(name: string, icon: string, items: any[], type: Type) {
  return items.map(item => {
    const {
      key,
      editable,
      keyname,
      allowBatch,
      shiftKey,
      workflow,
      weight,
    } = item;

    return {
      key: item.key,
      type,
      orkey: item.key,
      title: t(`${name}_${keyname || key}_title`),
      subtitle: t(`${name}_${keyname || key}_subtitle`),
      icon,
      allowBatch,
      workflow,
      weight,
      shiftKey,
      editable: editable !== false,
    } as Command;
  });
}

function getDefaultResult(command) {
  return [
    {
      isDefault: true,
      icon: command.icon,
      title: command.title,
      desc: command.subtitle,
    },
  ];
}

function getSteward() {
  return window.__Steward__;
}

const loadingIcon = getURL('iconfont/loading.svg');

function getLoadingResult(command) {
  let theCommand;

  if (!command) {
    theCommand = getSteward().app.getCurrentCommand();
  }

  if (theCommand) {
    return [
      {
        icon: theCommand.icon,
        title: theCommand.title,
        desc: 'Loading...',
        isDefault: true,
      },
    ];
  } else {
    return [
      {
        icon: loadingIcon,
        title: 'Loading....',
        isDefault: true,
      },
    ];
  }
}

function getEmptyResult(command, msg) {
  return [
    {
      isDefault: true,
      icon: command.icon,
      title: msg || 'No query results...',
    },
  ];
}

function copyToClipboard(text: string, showMsg: boolean): void {
  document.addEventListener(
    'copy',
    event => {
      event.preventDefault();
      event.clipboardData.setData('text/plain', text);

      if (showMsg) {
        Toast.success(`"${text}" has been copied to the clipboard`, '', {
          timeOut: 1000,
        });
      }
    },
    { once: true },
  );

  document.execCommand('copy');
}

function getMatches(suggestions: any[], query: string, key?: string) {
  const matches = fuzzaldrinPlus.filter(suggestions, query, {
    maxResults: 20,
    usePathScoring: true,
    key,
  });

  return matches;
}

function getParameterByName(name: string, search = window.location.search) {
  const urlsearch = new URLSearchParams(search);

  return urlsearch.get(name);
}

const array2map = (keyField: string, valField) => (arr: any[]) => {
  const ret = {};

  arr.forEach(item => {
    if (valField) {
      ret[item[keyField]] = item[valField];
    } else {
      ret[item[keyField]] = item;
    }
  });

  return ret;
};

const options2map = array2map('value', 'label');

const wrapWithMaxNumIfNeeded = (
  field,
  maxOperandsNum = window.stewardCache.config.general.maxOperandsNum,
) => (item, index) => {
  let ret = field ? item[field] : item;

  if (index < maxOperandsNum) {
    ret = `⇧: ${ret}`;
  }

  return ret;
};

type ListAndItem = [ResultItem[], ResultItem | ResultItem[]]
const batchExecutionIfNeeded = (
  predicate: boolean,
  actions: ((item: any, keyStatus?: KeyStatus) => void)[],
  listAndItem: ListAndItem,
  keyStatus?: KeyStatus,
  maxOperandsNum = window.stewardCache.config.general.maxOperandsNum,
) => {
  const results = [];
  const [exec4batch, exec] = actions;
  const [list, item] = listAndItem;

  if (predicate || item instanceof Array) {
    const num = predicate ? maxOperandsNum : item.length;

    results.push(list.slice(0, num).forEach((value) => exec4batch(value, keyStatus)));
  } else {
    results.push(exec(item, keyStatus));
  }

  return Promise.all(results);
};

const createTab = (item: Partial<ResultItem>, keyStatus: Partial<KeyStatus> = {}) => {
  const { mode, inContent } = getSteward();

  if (mode === 'popup' && !inContent) {
    chrome.tabs.create({ url: item.url });
  } else {
    if (keyStatus.metaKey) {
      chrome.tabs.getCurrent(tab => {
        chrome.tabs.update(tab.id, {
          url: item.url,
        });
      });
    } else {
      chrome.tabs.create({ url: item.url });
    }
  }
};

const tabCreateExecs = [
  (item: Partial<ResultItem>) => {
    chrome.tabs.create({ url: item.url, active: false });
    window.slogs.push(`open ${item.url}`);
  },
  (item: Partial<ResultItem>, keyStatus: Partial<KeyStatus> = {}) => {
    createTab(item, keyStatus);

    window.slogs.push(`open ${item.url}`);
  },
];

function getLang() {
  if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    return 'zh';
  } else {
    return 'en';
  }
}

function getDocumentURL(name: string, category: string) {
  const lang = getLang();
  let baseUrl;
  const fixedName = name.replace(/\s/, '-');

  if (lang === 'en') {
    baseUrl = `http://oksteward.com/steward-documents/plugins/${category}`;
  } else {
    baseUrl = `http://oksteward.com/steward-documents/zh/plugins/${category}`;
  }

  return `${baseUrl}/${fixedName}.html`;
}

function getBytesInUse(key: string) {
  return new Promise(resolve => {
    chrome.storage.sync.getBytesInUse(key, resp => {
      console.log(resp);
      resolve(resp);
    });
  });
}

function isStorageSafe(key: string) {
  if (!key) {
    return Promise.reject('Storage is full, can not be added!');
  } else {
    return getBytesInUse(key).then(size => {
      const safetyFactor = 0.85;
      console.log(`${key} size: ${size}`);

      if (size > QUOTA_BYTES_PER_ITEM * safetyFactor) {
        return Promise.reject();
      } else {
        return true;
      }
    });
  }
}

function shouldSupportMe() {
  const nums = [6, 8, 66, 88, 666, 888];
  const random = Math.floor(Math.random() * 1000);
  console.log(random);

  if (nums.indexOf(random) !== -1) {
    return true;
  } else {
    return false;
  }
}

type TplData = {[prop: string]: any};
function simTemplate(tpl: string, data: TplData) {
  return tpl.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, function(m, $1) {
    return typeof data[$1] !== 'undefined' ? data[$1] : '';
  });
}

const getData = field => () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: field,
      },
      resp => {
        if (resp) {
          resolve(resp.data);
        } else {
          reject(null);
        }
      },
    );
  });
};

function getTplMsg(tplKey: string, data: TplData) {
  return simTemplate(t(tplKey), data);
}

function getTextMsg(tplKey: string, textKey: string) {
  const data = {
    text: t(textKey),
  };

  return getTplMsg(tplKey, data);
}

function getURLParams(keys: string[], search = window.location.search): {[prop: string]: any} {
  const searchParams = new URLSearchParams(search);

  return keys.reduce((obj, key) => {
    obj[key] = searchParams.get(key);

    return obj;
  }, {});
}

export default {
  matchText,
  isMac,
  guid,
  simpleCommand,
  getTplMsg,
  getTextMsg,
  genCommands,
  getDefaultResult,
  getLoadingResult,
  getEmptyResult,
  copyToClipboard,
  getMatches,
  getParameterByName,
  array2map,
  options2map,
  wrapWithMaxNumIfNeeded,
  batchExecutionIfNeeded,
  tabCreateExecs,
  getDocumentURL,
  isStorageSafe,
  shouldSupportMe,
  simTemplate,
  getData,
  createTab,
  toast: Toast,
  getURLParams,
};
