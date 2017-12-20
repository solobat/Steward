import { DiaryList } from '../collection/diary'
import _ from 'underscore'

const diaryList = new DiaryList();

function downloadTextFile(filename, text) {
    const element = document.createElement('a');

    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export default {
    create(info) {
        if (info.date && info.content) {
            const diary = diaryList.create({
                ...info
            });

            return diary;
        } else {
            return 'no title or content';
        }
    },

    remove(id) {
        const model = diaryList.remove(id);
        diaryList.chromeStorage.destroy(model);

        return model;
    },

    update(attrs) {
        const diary = diaryList.set(attrs, {
            add: false,
            remove: false
        });

        diary.save();

        return diary;
    },

    updateMessages(messages, date, isFirst) {
        let diary = diaryList.find({ date });

        if (!diary) {
            console.log('create new diary');
            diary = this.create({
                date,
                content: [messages]
            });
        } else {
            const content = diary.get('content');

            if (isFirst) {
                content.push(messages);
            } else {
                content.pop();
                content.push(messages);
            }

            diary.save();
        }

        return this.refresh();
    },

    refresh() {
        return new Promise((resolve, reject) => {
            diaryList.fetch().done(resp => {
                resolve(resp);
            }).fail(resp => {
                reject(resp);
            });
        });
    },

    getDiaryList() {
        return diaryList.toJSON();
    },

    download(date) {
        const diary = diaryList.find({ date });

        const text = _.reduce(diary.get('content'), (memo, session) => {
            const next = _.reduce(session, (submemo, msg) => {
                return `${submemo}\n${msg && msg.text}`;
            }, '');

            return `${memo}\n${next}`;
        }, '');

        downloadTextFile(`steward_diary_${date}`, text);
    },

    init() {
        return this.refresh().then(() => {
            const list = this.getDiaryList();

            return list;
        });
    }
}