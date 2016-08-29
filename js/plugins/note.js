/**
 * @file
 * @description 待办事项管理，并在标签页显示
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var util = require('../common/util')
    var name = 'note'
    var key = ['note', '#']
    var icon = chrome.extension.getURL('img/note.png')
    var title = chrome.i18n.getMessage(name + '_title')
    var subtitle = chrome.i18n.getMessage(name + '_subtitle')
    var tagReg = /#([a-zA-Z\u4e00-\u9fa5]+)/ig

    function createNote(...args) {
        return {
            text: args[0],
            tags: args[1],
            _id: util.guid()
        }
    }

    function onInput(key) {
        if (this.cmd === '#') {
            handleTagQuery.call(this, key)
        } else {
            this.showItemList([
                {
                    icon: icon,
                    title: '新增一条笔记',
                    desc: '#添加标签'
                }
            ])
        }
    }

    function handleTagQuery(key) {
        var that = this

        queryNotesByTag(key).then((res) => {
            var data

            if (res.type === 'tag') {
                data = res.data.map((tag) => {
                    return {
                        key: 'tag',
                        icon: icon,
                        id: tag,
                        title: '#' + tag,
                        desc: 'tag'
                    }
                })
            } else {
                data = res.data.map((note) => {
                    return {
                        key: key,
                        icon: icon,
                        title: note.text,
                        desc: 'note'
                    }
                })
            }

            that.showItemList(data)
        })
    }

    function queryNotesByTag(query) {
        return new Promise((resolve, reject) => {
            Promise.all([
                getNotes(),
                getTags()
            ]).then((res) => {
                var notes = res[0]
                var tags = res[1]

                if (!tags[query]) {
                    resolve({
                        data: Object.keys(tags).filter((tag) => tag.indexOf(query) !== -1),
                        type: 'tag'
                    })
                } else {
                    resolve({
                        data: tags[query].map((id) => findNoteById(notes, id)),
                        type: 'note'
                    })
                }
            })
        })
    }


    function findNoteById(notes, id) {
        return notes.filter((note) => note._id === id)[0]
    }

    function onEnter(key, elem) {
        if (this.cmd === '#') {
            var $elem = $(elem);
            var type = $elem.data('type')

            if (type === 'tag') {
                this.ipt.val('# ' + $elem.data('id'))
                this.ipt.trigger('input')
            }
        } else {
            var query = this.query
            var matches = query.match(tagReg)
            if (!matches) {
                console.log('标签不能为空');
                return
            }

            var tags = matches.map((match) => match.substr(1))
            var noteText = query.replace(/[#\s]+/g, '')
            var note = createNote(noteText, tags)

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
            var notes = res[0] = res[0] || []

            notes.push(note)

            // push tags
            var tags = res[1] || {};

            note.tags.forEach((tag) => {
                if (!tags[tag]) {
                    tags[tag] = []
                }

                tags[tag].push(note._id)
            })

            res[1] = tags

            return res
        }).then((res) => {
            chrome.storage.sync.set({
                notes: res[0],
                tags: res[1]
            }, () => {})
        })
    }

    function getNotes() {
        return new Promise(function(resolve, reject) {
            chrome.storage.sync.get('notes', (results) => resolve(results.notes))
        });
    }

    function getTags() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get('tags', (results) => resolve(results.tags))
        })
    }

    module.exports = {
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter
    }
});
