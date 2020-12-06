/**
 * @description search
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import { Plugin } from 'plugins/type';
import { StewardApp } from 'common/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';

export default function(Steward: StewardApp): Plugin {
  const { chrome, Toast, browser, util } = Steward;

  const name = 'newtab';
  const version = 2;
  const type = 'keyword';
  const keys = [{ key: 'nt' }, { key: 'ntm' }];
  const NOTES_KEY = 'titleNotes';
  const icon = getURL('iconfont/new-tab.svg');
  const title = t(`${name}_title`);
  const commands = util.genCommands(name, icon, keys, type);
  const allActions = [
    {
      icon,
      key: 'visibleOnlyFocued',
      title: t('newtab_visibleOnlyFocued_title'),
      desc: t('newtab_visibleOnlyFocued_subtitle'),
      type: 'boolean',
    },
    {
      icon,
      key: 'newTabTitle',
      title: t('newtab_newTabTitle_title'),
      desc: t('newtab_newTabTitle_subtitle'),
      type: 'string',
    },
    {
      icon,
      key: 'newTabUseFilter',
      title: t('newtab_newTabUseFilter_title'),
      desc: t('newtab_newTabUseFilter_subtitle'),
      type: 'boolean',
    },
  ];

  const noteDesc = t('newtab_ntm_subtitle');

  function dataFormat(notes = []) {
    return notes.map(note => {
      return {
        icon,
        title: note,
        desc: noteDesc,
      };
    });
  }

  function handleNtInput() {
    return Promise.resolve(allActions);
  }

  function handleRandomNotesInput(command) {
    window.localStorage.setItem('titleType', 'random');

    return browser.storage.local.get(NOTES_KEY).then(resp => {
      const notes = resp[NOTES_KEY];

      if (notes && notes.length) {
        return dataFormat(notes);
      } else {
        return util.getDefaultResult(command);
      }
    });
  }

  function onInput(query, command) {
    const { orkey } = command;

    if (orkey === 'nt') {
      return handleNtInput();
    } else if (orkey === 'ntm') {
      return handleRandomNotesInput(command);
    }
  }

  function handleNtEnter(item) {
    const actionType = item.type;

    if (actionType === 'boolean') {
      toggleAction(item);
    } else if (actionType === 'string') {
      setNewValueFromUserInput(item);
    }

    window.location.reload();
  }

  function addRandomItem(text) {
    return browser.storage.local
      .get(NOTES_KEY)
      .then(resp => {
        const list = resp[NOTES_KEY] || [];

        list.push(text);

        return list;
      })
      .then(newList => {
        return browser.storage.local.set({
          [NOTES_KEY]: newList,
        });
      });
  }

  function removeRandomItem(item) {
    return browser.storage.local
      .get(NOTES_KEY)
      .then(resp => {
        const list = resp[NOTES_KEY] || [];

        return list.filter(text => text !== item.title);
      })
      .then(newList => {
        return browser.storage.local.set({
          [NOTES_KEY]: newList,
        });
      });
  }

  function handleRandomNotesEnter(item, query, command) {
    if (query) {
      return addRandomItem(query).then(() => {
        return `${command.key} `;
      });
    } else {
      return removeRandomItem(item).then(() => {
        return '';
      });
    }
  }

  function onEnter(item, command, query) {
    const { orkey } = command;

    if (orkey === 'nt') {
      handleNtEnter(item);
    } else if (orkey === 'ntm') {
      return handleRandomNotesEnter(item, query, command);
    }
  }

  function toggleAction(item) {
    const oldValue = window.localStorage.getItem(item.key);
    const newValue = oldValue ? '' : '1';

    window.localStorage.setItem(item.key, newValue);

    Toast.success(
      util.simTemplate(t('toggle_ok'), {
        text: item.title,
      }),
    );
  }

  function setNewValueFromUserInput(item) {
    const oldValue = window.localStorage.getItem(item.key) || 'New Tab';

    const result = window.prompt(item.title, oldValue);

    window.localStorage.setItem(item.key, result || 'New Tab');
    window.localStorage.setItem('titleType', 'fixed');
    Toast.success(t('set_ok'));
  }

  return {
    version,
    name: 'New Tab',
    category: 'steward',
    icon,
    title,
    onInput,
    onEnter,
    commands,
    canDisabled: false,
  };
}
