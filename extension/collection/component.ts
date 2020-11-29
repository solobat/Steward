/**
 * @file website.js
 * @author solopea@gmail.com
 */
import Backbone from 'backbone'
import ChromeStorage from '../lib/backbone.chromestorage';

export const Component = Backbone.Model.extend({
    sync: Backbone.sync,
    defaults: function () {
        return {
            created: Number(new Date()),
            updated: Number(new Date())
        };
    }
});

export const ComponentList = Backbone.Collection.extend({
    model: Component,

    chromeStorage: new ChromeStorage("components", "local"),

    nextOrder: function () {
        if (!this.length) {
            return 1;
        }
        return this.last().get('created') + 1;
    },

    comparator: 'created'
});