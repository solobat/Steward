
import Backbone from 'backbone';

import ChromeStorage from '../lib/backbone.chromestorage';

export const CustomPlugin = Backbone.Model.extend({
  sync: Backbone.sync,
  defaults: function() {
    return {
      created: Number(new Date()),
      updated: Number(new Date()),
    };
  },
});

export const CustomPluginList = Backbone.Collection.extend({
  model: CustomPlugin,

  chromeStorage: new ChromeStorage('custompluginlist', 'local'),

  nextOrder: function() {
    if (!this.length) {
      return 1;
    }
    return this.last().get('created') + 1;
  },

  comparator: 'created',
});
