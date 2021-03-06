/**
 * @description find in your pocket
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery';
import _ from 'underscore';

import Auth from 'common/auth';
import conf from 'conf/pocket_conf';
import { Command, Plugin } from 'plugins/type';
import { StewardApp } from 'common/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome, util, constant, browser } = Steward;

  const auth = new Auth(conf);
  const version = 4;
  const name = 'pocket';
  const key = 'po';
  const type = 'keyword';
  const icon = getURL('iconfont/share-icons/getpocket.svg');
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

  function handler(results) {
    const ret = {
      request_token: results.split('=')[1],
    };

    return ret;
  }

  let ajax;

  function dataFormat(rawList) {
    return rawList.map(function(item) {
      const itemTitle = item.given_title || item.resolved_title || item.excerpt;

      return {
        key: constant.BASE.ITEM_TYPE.URL,
        id: item.id,
        icon: icon,
        title: itemTitle,
        desc: subtitle,
        universal: true,
        url: item.resolved_url,
      };
    });
  }

  function onInput(queryString) {
    if (!queryString && !auth.isAuthenticated()) {
      auth.authenticate(handler);

      return;
    }

    if (!queryString) {
      getCachedList().then(resp => {
        Steward.app.updateList(resp.pocket_list || []);
      });
    }

    return new Promise(resolve => {
      query(queryString, function(data) {
        const list = dataFormat(data);

        resolve(list);
        if (!queryString) {
          cacheList(list);
        }
      });
    });
  }

  function getCachedList() {
    return browser.storage.local.get('pocket_list');
  }

  function cacheList(pocket_list) {
    return browser.storage.local.set({
      pocket_list,
    });
  }

  function query(str, callback) {
    if (ajax) {
      ajax.abort();
    }
    const params = {
      consumer_key: auth.consumer_key,
      access_token: auth.get(auth.accessTokenName),
      count: 20,
      state: 'unread',
      sort: 'newest',
    };

    if (str) {
      $.extend(params, {
        search: str,
        state: 'all',
      });
    }

    ajax = $.post('https://getpocket.com/v3/get', params, function(data) {
      if (data.list) {
        const list = [];
        let i;

        for (i in data.list) {
          const item = data.list[i];

          item.id = i;
          list.push(item);
        }
        callback(_.sortBy(list, 'time_added').reverse());
      }
    });
  }

  function onEnter(item, command, q, keyStatus, list) {
    const { shiftKey } = keyStatus;

    function resolveUrl(it) {
      if (shiftKey) {
        return it.resolved_url;
      } else {
        return `https://getpocket.com/a/read/${it.id}`;
      }
    }
    util.batchExecutionIfNeeded(
      false,
      [
        it => {
          chrome.tabs.create({ url: resolveUrl(it), active: false });
          window.slogs.push(`open pocket ${it.title}`);
        },
        it => {
          util.createTab({ url: resolveUrl(it) }, keyStatus);
          window.slogs.push(`open pocket ${it.title}`);
        },
      ],
      [list, item],
    );
  }

  function onLeave() {
    if (ajax) {
      ajax.abort();
    }
  }

  function authenticate() {
    auth.reAuthenticate(handler);
  }

  function onStorageChange(event) {
    if (event.key === 'pocket_username') {
      Steward.app.applyCommand(Steward.state.str);
    }
  }

  return {
    version,
    name: 'Pocket',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    onLeave,
    authenticate,
    onStorageChange,
    canDisabled: true,
  };
}
