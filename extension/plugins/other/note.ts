/**
 * @description add notes
 * @author tomasy
 * @email solopea@gmail.com
 */

import { Plugin } from 'plugins/type';
import { StewardApp } from 'common/type';
import { t } from 'helper/i18n.helper';
import { getURL } from 'helper/extension.helper';
import stewardCache from 'main/cache';

export default function(Steward: StewardApp): Plugin {
  const { chrome, util, browser, Toast, constant } = Steward;

  const version = 3;
  const name = 'note';
  const keys = [
    { key: 'note' },
    { key: '#', keyname: 'notetag', editable: false },
    { key: 'notes', shiftKey: true },
  ];
  const type = 'keyword';
  const icon = getURL('iconfont/note.svg');
  const title = t(`${name}_title`);
  const tagReg = /#([a-zA-Z\u4e00-\u9fa5]+)/gi;
  const commands = util.genCommands(name, icon, keys, type);

  function createNote(...args) {
    return {
      text: args[0],
      tags: args[1],
      _id: util.guid(),
    };
  }

  function onInput(key, command) {
    const { orkey } = command;

    if (orkey === '#') {
      const { inContent } = stewardCache;

      if (inContent && key === '/') {
        return `# ${window.parentHost}`;
      } else {
        return handleTagQuery(key, command);
      }
    } else if (orkey === 'note') {
      return util.getDefaultResult(command);
    } else {
      return getNotes().then(notes =>
        dataFormat(
          notes.filter(function(note) {
            return util.matchText(key, note.text);
          }),
          command,
        ),
      );
    }
  }

  function dataFormat(notes = [], command) {
    return notes
      .filter(item => Boolean(item))
      .map(note => {
        return {
          key: 'plugin',
          icon: icon,
          id: note._id,
          title: note.text,
          desc: command.subtitle,
        };
      });
  }

  function handleTagQuery(key, command) {
    return queryNotesByTag(key).then((res: any) => {
      let data;

      if (res.type === 'tag') {
        data = res.data.map(tag => {
          return {
            key: 'tag',
            icon: icon,
            id: tag,
            title: `#${tag}`,
            desc: 'tag',
          };
        });
      } else {
        data = dataFormat(res.data, command);
      }

      return data;
    });
  }

  function queryNotesByTag(query) {
    return new Promise(resolve => {
      Promise.all([getNotes(), getTags()]).then(res => {
        const notes = res[0];
        const tags = res[1] || {};

        if (!tags[query]) {
          resolve({
            data: Object.keys(tags).filter(tag => tag.indexOf(query) !== -1),
            type: 'tag',
          });
        } else {
          resolve({
            data: tags[query].map(id => findNoteById(notes, id)),
            type: 'note',
          });
        }
      });
    });
  }

  function findNoteById(notes, id) {
    return notes.filter(note => note._id === id)[0];
  }

  function copyNote(note, ret = false) {
    util.copyToClipboard(note.title, true);

    return Promise.resolve(ret);
  }

  function handleTagEnter(item) {
    if (item.key === 'tag') {
      return Promise.resolve(`# ${item.id}`);
    } else {
      return copyNote(item);
    }
  }

  function handleNoteEnter(query, orkey) {
    const { inContent } = stewardCache;
    const matches = query.match(tagReg) || [];
    const tags = matches.map(match => match.substr(1));

    if (inContent && window.parentHost) {
      tags.push(window.parentHost);
    }

    const noteText = query.replace(/[#]+/g, '');
    const note = createNote(noteText, tags);

    return saveNote(note)
      .then(() => {
        Toast.success('Add note successfully!');

        return Promise.resolve(`${orkey} `);
      })
      .catch(() => {
        console.log('save note error');
      });
  }

  function handleNotesEnter(item, shiftKey) {
    if (shiftKey) {
      return deleteNote(item.id).then(() => {
        Toast.success('Add note successfully!');

        return copyNote(item, false);
      });
    } else {
      return copyNote(item);
    }
  }

  function onEnter(item, command, query, { shiftKey }) {
    const { orkey } = command;

    if (orkey === '#') {
      return handleTagEnter(item);
    } else if (orkey === 'note') {
      return handleNoteEnter(query, orkey);
    } else {
      return handleNotesEnter(item, shiftKey);
    }
  }

  function saveNote(note) {
    if (!note || !note.text) {
      return Promise.reject();
    }

    return util
      .isStorageSafe(constant.STORAGE.NOTES)
      .then(() => {
        return Promise.all([getNotes(), getTags()])
          .then(function(res) {
            // push note
            const notes = (res[0] = res[0] || []);

            notes.push(note);

            // push tags
            const tags = res[1] || {};

            note.tags.forEach(tag => {
              if (!tags[tag]) {
                tags[tag] = [];
              }

              tags[tag].push(note._id);
            });

            res[1] = tags;

            return res;
          })
          .then(res => {
            browser.storage.sync.set({
              notes: res[0],
              tags: res[1],
            });
          });
      })
      .catch(() => {
        Toast.warning(t('STORAGE_WARNING'));

        return Promise.reject();
      });
  }

  function deleteNote(id) {
    return getNotes()
      .then(notes => {
        return notes.filter(note => note._id !== id);
      })
      .then(newNotes => {
        browser.storage.sync.set({
          [constant.STORAGE.NOTES]: newNotes,
        });
      })
      .then(() => {
        refreshTags(id);
      });
  }

  function refreshTags(deletedId) {
    return getTags()
      .then(tags => {
        const newTags = {};

        for (const tag in tags) {
          const ids = tags[tag].filter(id => id !== deletedId);

          if (ids.length > 0) {
            newTags[tag] = ids;
          }
        }

        return newTags;
      })
      .then(newTags => {
        browser.storage.sync.set({
          [constant.STORAGE.TAGS]: newTags,
        });
      });
  }

  function getNotes() {
    return browser.storage.sync
      .get(constant.STORAGE.NOTES)
      .then(results => results.notes);
  }

  function getTags() {
    return browser.storage.sync.get(constant.STORAGE.TAGS).then(results => results.tags);
  }

  return {
    version,
    name: 'Note',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true,
  };
}
