/**
 * @description add notes
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import Toast from 'toastr'

const version = 2;
const name = 'note';
const keys = [{key: 'note'}, {key: '#', keyname: 'notetag', editable: false}];
const type = 'keyword';
const icon = chrome.extension.getURL('img/note.png')
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const tagReg = /#([a-zA-Z\u4e00-\u9fa5]+)/ig
const commands = util.genCommands(name, icon, keys, type);

function createNote(...args) {
    return {
        text: args[0],
        tags: args[1],
        _id: util.guid()
    }
}

function onInput(key) {
    if (this.cmd === '#') {
        const { inContent } = window.stewardCache;

        if (inContent && key === '/') {
            return `# ${window.parentHost}`;
        } else {
            return handleTagQuery(key);
        }
    } else {
        return [
            {
                icon: icon,
                title,
                desc: subtitle
            }
        ];
    }
}

function handleTagQuery(key) {
    return queryNotesByTag(key).then(res => {
        let data;

        if (res.type === 'tag') {
            data = res.data.map(tag => {
                return {
                    key: 'tag',
                    icon: icon,
                    id: tag,
                    title: `#${tag}`,
                    desc: 'tag'
                }
            })
        } else {
            data = res.data.map(note => {
                return {
                    key: key,
                    icon: icon,
                    title: note.text,
                    desc: 'Copy note to your clipboard'
                }
            })
        }

        return data;
    })
}

function queryNotesByTag(query) {
    return new Promise(resolve => {
        Promise.all([
            getNotes(),
            getTags()
        ]).then(res => {
            const notes = res[0];
            const tags = res[1] || {};

            if (!tags[query]) {
                resolve({
                    data: Object.keys(tags).filter(tag => tag.indexOf(query) !== -1),
                    type: 'tag'
                })
            } else {
                resolve({
                    data: tags[query].map(id => findNoteById(notes, id)),
                    type: 'note'
                })
            }
        })
    })
}


function findNoteById(notes, id) {
    return notes.filter(note => note._id === id)[0]
}

function onEnter(item) {
    if (this.cmd === '#') {
        if (item.key === 'tag') {
            return Promise.resolve(`# ${item.id}`);
        } else {
            util.copyToClipboard(item.title, true);
            return Promise.resolve(false);
        }
    } else {
        const { inContent } = window.stewardCache;
        const query = this.query;
        const matches = query.match(tagReg) || [];
        const tags = matches.map(match => match.substr(1))

        if (inContent && window.parentHost) {
            tags.push(window.parentHost);
        }

        if (!tags.length) {
            Toast.warning('Label can not be empty');
            return Promise.resolve(true);
        }

        const noteText = query.replace(/[#]+/g, '')
        const note = createNote(noteText, tags)

        saveNote(note)
        this.clearQuery()
    }
}

function saveNote(note) {
    if (!note || !note.text) {
        return
    }

    Promise.all([
        getNotes(),
        getTags()
    ]).then(function(res) {
        // push note
        const notes = res[0] = res[0] || [];

        notes.push(note)

        // push tags
        const tags = res[1] || {};

        note.tags.forEach(tag => {
            if (!tags[tag]) {
                tags[tag] = []
            }

            tags[tag].push(note._id)
        })

        res[1] = tags;

        return res;
    }).then(res => {
        chrome.storage.sync.set({
            notes: res[0],
            tags: res[1]
        }, () => {})
    })
}

function getNotes() {
    return new Promise(function(resolve) {
        chrome.storage.sync.get('notes', results => resolve(results.notes))
    });
}

function getTags() {
    return new Promise(resolve => {
        chrome.storage.sync.get('tags', results => resolve(results.tags))
    })
}

export default {
    version,
    name: 'Note',
    icon,
    title,
    commands,
    onInput,
    onEnter
}
