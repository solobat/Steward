/**
 * @file word.js
 * @author solopea@gmail.com
 */
import Backbone from 'backbone'
import ChromeStorage from '../lib/backbone.chromestorage';

export const Workflow = Backbone.Model.extend({
    sync: Backbone.sync,
    defaults: function () {
        return {
            created: Number(new Date()),
            updated: Number(new Date())
        };
    }
});

export const WorkflowList = Backbone.Collection.extend({
    model: Workflow,

    chromeStorage: new ChromeStorage("workflows", "sync"),

    nextOrder: function () {
        if (!this.length) {
            return 1;
        }
        return this.last().get('created') + 1;
    },

    comparator: 'created'
});