/**
 * @file word.js
 * @author solopea@gmail.com
 */
import Backbone from 'backbone'
import '../../lib/backbone.chromestorage'

export const Diary = Backbone.Model.extend({
    sync: Backbone.sync,
    defaults: function () {
        return {
            created: Number(new Date()),
            updated: Number(new Date())
        };
    }
});

export const DiaryList = Backbone.Collection.extend({
    model: Diary,

    chromeStorage: new Backbone.ChromeStorage("diarylist", "local"),

    nextOrder: function () {
        if (!this.length) {
            return 1;
        }
        return this.last().get('created') + 1;
    },

    comparator: 'created'
});