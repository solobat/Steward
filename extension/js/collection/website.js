/**
 * @file website.js
 * @author solopea@gmail.com
 */
import Backbone from 'backbone'
import '../../lib/backbone.chromestorage'

export const Website = Backbone.Model.extend({
    sync: Backbone.sync,
    defaults: function () {
        return {
            created: Number(new Date()),
            updated: Number(new Date())
        };
    }
});

export const WebsiteList = Backbone.Collection.extend({
    model: Website,

    chromeStorage: new Backbone.ChromeStorage("websites", "local"),

    nextOrder: function () {
        if (!this.length) {
            return 1;
        }
        return this.last().get('created') + 1;
    },

    comparator: 'created'
});