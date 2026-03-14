import _ from 'underscore'
import $ from 'jquery'
import Backbone from 'backbone'
// #ChromeStorage.Wrapper

// A wrapper around the `chrome.storage.*` API that uses
// `$.Deferred` objects for greater flexibility.
function Wrapper(type) {
  type = ''+type || 'local';

  if (!chrome.storage[type]) {
    console.warn('Unknown type %s, defaulting to local', type);
    type = 'local';
  }

  this.type = type;
  this.storage = chrome.storage[this.type];
}

// ## _csResponse
//
// Private helper function that's used to return a callback to
// wrapped `chrome.storage.*` methods.
//
// It will **resolve** the provided `$.Deferred` object
// with the response, or **reject** it if there was an
// error.
function _csResponse(dfd) {
  return function() {
    var err = chrome.runtime.lastError;
    if (!err)
      dfd.resolve.apply(dfd, arguments);
    else {
      console.warn("chromeStorage error: '%s'", err.message);
      dfd.reject(dfd, err.message, err);
    }
  };
}

// ## chrome.storage.* API
// Private factory functions for wrapping API methods

// ### wrapMethod
//
// For wrapping **clear** and **getBytesInUse**
function wrapMethod(method) {
  return function(cb) {
    var dfd = $.Deferred();

    if (typeof cb === 'function')
      dfd.done(cb);

    this.storage[method](_csResponse(dfd));

    return dfd.promise();
  };
}

// ### wrapAccessor
//
// For wrapping **get**, **set**, and **remove**.
function wrapAccessor(method) {
  return function(items, cb) {
    var dfd = $.Deferred();

    if (typeof cb === 'function')
      dfd.done(cb);

    this.storage[method](items, _csResponse(dfd));

    return dfd.promise();
  };
}

// The `Wrapper` prototype has the same methods as the `chrome.storage.*` API,
// accepting the same parameters, except that they return `$.Deferred` promise
// and the callback is always optional. If one is provided, it will be added as a
// **done** callback.
_(Wrapper.prototype).extend({
  getBytesInUse: wrapMethod('getBytesInUse'),

  clear: wrapMethod('clear'),

  get: wrapAccessor('get'),

  set: wrapAccessor('set'),

  remove: wrapAccessor('remove'),

  // Pick out the relevant properties from the storage API.
  getQuotaObject: function() {
    return _(this.storage).pick(
      'QUOTA_BYTES',
      'QUOTA_BYTES_PER_ITEM',
      'MAX_ITEMS',
      'MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE',
      'MAX_WRITE_OPERATIONS_PER_HOUR');
  }
});

// #Backbone.ChromeStorage

// Public API is essentially the same as Backbone.localStorage.
function ChromeStorage(name, type) {
  _.bindAll.apply(_, [this].concat(_.functions(this)));

  this.name = name;
  this.type = type || ChromeStorage.defaultType || 'local';
  this.store = new Wrapper(this.type);

  this.loaded = this.store.get(this.name).
    pipe(this._parseRecords).
    done((function(records) {
      this.records = records;
      chrome.storage.onChanged.addListener(this.updateRecords.bind(this));
    }).bind(this));
}


// `Backbone.ChromeStorage.defaultType` can be overridden globally if desired.
//
// The current options are `'local'` or `'sync'`.
ChromeStorage.defaultType = 'local';

// ### wantsJSON

// Private helper function for use with a `$.Deferred`'s **pipe**.
//
// It mimics the effect of returning a JSON representation of the
// provided model from a server, in order to satisfy Backbone.sync
// methods that expect that.
function wantsJSON(model) {
  return function() {
    return model.toJSON();
  };
}

// ### _S4
// Generate a random four-digit hex string for **_guid**.
function _S4() {
  return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// ### _guid
// Pseudo-GUID generator
function _guid() {
  return (_S4()+_S4()+"-"+_S4()+"-"+_S4()+"-"+_S4()+"-"+_S4()+_S4()+_S4());
}

// ### unstringify
// Gracefully upgrade from stringified models.
function unstringify(model) {
  return typeof model === 'string' ? JSON.parse(model) : model;
}

_(ChromeStorage.prototype).extend({
  // ## Methods for updating the record string
  //
  // ### updateRecords
  updateRecords: function(changes, type) {
    var records_change = changes[this.name];

    if (this._recordsChanged(records_change, type)) {
      this.records = records_change.newValue;
    }
  },

  // *StorageChange* `records_change`
  // *string* `type` is one of 'local' or 'sync'
  _recordsChanged: function(records_change, type) {
    if (type === this.type && records_change) {
      return !_.isEqual(records_change.newValue, this.records);
    } else {
      return false;
    }
  },

  // ## CRUD methods
  //
  // ### create
  create: function(model) {
    if (!model.id) {
      model.id = _guid();
      model.set(model.idAttribute, model.id);
    }

    return this.store.set(this._wrap(model), this._created.bind(this, model)).pipe(wantsJSON(model));
  },

  _created: function(model) {
    this.records.push(''+model.id);
    this.save();
  },

  // ### update
  update: function(model) {
    return this.store.set(this._wrap(model), this._updated.bind(this, model)).pipe(wantsJSON(model));
  },

  _updated: function(model) {
    var id = ''+model.id;

    if (!_(this.records).include(id)) {
      this.records.push(id);
      this.save();
    }
  },

  // ### find
  find: function(model) {
    return this.store.get(this._wrap(model)).pipe(this._found.bind(this, model));
  },

  _found: function(model, result) {
    return unstringify(result[this._idOf(model)]);
  },

  // ### findAll
  findAll: function() {
    var modelsDfd = $.Deferred()
      /* Bind the callback to use once the models are fetched. */
      , resolveModels = modelsDfd.resolve.bind(modelsDfd)
    ;

    // Waits until the model IDs have been initially
    // populated, and then queries the storage for
    // the actual records.
    $.when(this.loaded).done((function(records) {
      var model_ids = this._getRecordIds();

      this.store.get(model_ids, resolveModels);
    }).bind(this));

    return modelsDfd.pipe(this._foundAll);
  },

  _foundAll: function(models) {
    return _(models).map(unstringify);
  },

  // ### destroy
  destroy: function(model) {
    return this.store.
      remove(this._idOf(model), this._destroyed.bind(this, model)).
      pipe(wantsJSON(model));
  },

  _destroyed: function(model) {
    this.records = _.without(this.records, model.id);
    this.save();
  },

  // ## Utility methods
  //
  // ### quota
  // This is mostly relevant in `sync` contexts,
  // given the rate-limited write operations.
  //
  // For `local` contexts, it will just return an object with
  // the `QUOTA_BYTES` property.
  //
  // In `sync` contexts, it will return the above as well as:
  //
  //  * `QUOTA_BYTES_PER_ITEM`
  //  * `MAX_ITEMS`
  //  * `MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE`
  //  * `MAX_WRITE_OPERATIONS_PER_HOUR`
  //
  // It also queries the API with `getBytesInUse`, adding that
  // to the resultant object under the property name `QUOTA_BYTES_IN_USE`.
  quota: function() {
    var q = this.store.getQuotaObject();

    return this.store.getBytesInUse().pipe(function(bytes) {
      return _(q).extend({
        QUOTA_BYTES_IN_USE: bytes
      });
    });
  },

  // ### save
  // Save the current list of model ids into
  // a stringified array with the collection
  // name as key.
  save: function() {
    var o = {};

    o[this.name] = this.records;

    this.store.set(o);
  },

  // ### _getRecordIds
  // Get an array of all model IDs to fetch from storage,
  // prefixed with the collection name
  _getRecordIds: function() {
    return this.records.map(this._idOf);
  },

  // ### _idOf
  // Get the key that the item will be stored as:
  // the collection name followed by the model's id.
  //
  // Accepts a model instance or the id directly.
  _idOf: function(model) {
    return this.name+'-'+(_.isString(model) ? model : model.id);
  },

  // ### _wrap
  // Encapsulate a model into an object that
  // the storage API wants.
  //
  // Accepts a string ID or a model instance.
  _wrap: function(model) {
    var o = {};

    o[this._idOf(model)] = _.isString(model) ? model : model.toJSON();

    return o;
  },

  // ### _parseRecords
  // Takes the object returned from `chrome.storage` with the
  // collection name as a property name, and an array of model ids
  // as the property's value.
  //
  // Legacy support for stringified arrays.
  // It **split**s the string and returns the result.
  _parseRecords: function(records) {
    var record_list = records && records[this.name] ? records[this.name] : null;

    if (_.isArray(record_list)) {
      return record_list;
    } else if (typeof record_list === 'string') {
      console.debug('[Backbone.ChromeStorage (%s / %s)] upgrading from stringified array of ids', this.type, this.name);
      return record_list.split(',');
    } else {
      return [];
    }
  }
});

//## Backbone.chromeSync

// Largely the same implementation as in Backbone.localSync, except that
// `$.Deferred` objects are requisite.
ChromeStorage.sync = function(method, model, options, error) {
  var store = model.chromeStorage || model.collection.chromeStorage
    , resp
    , isFn = _.isFunction
  ;

  switch(method) {
    case "read":
      resp = model.id != null ? store.find(model) : store.findAll();
      break;
    case "create":
      resp = store.create(model);
      break;
    case "update":
      resp = store.update(model);
      break;
    case "delete":
      resp = store.destroy(model);
      break;
    default:
      var err = new Error('Unknown Method: "'+method+'"');
      resp = $.Deferred();
      resp.reject(resp, err.message, err);
  }

  if (isFn(options.success))
    resp.done(options.success);

  if (isFn(options.error))
    resp.fail(options.error);

  if (isFn(error))
    resp.fail(options.error);

  return resp && resp.promise();
};

const getSyncMethod = function(model) {
  if (model.chromeStorage || (model.collection && model.collection.chromeStorage))
    return ChromeStorage.sync;
  else
    return Backbone.sync;
};

Backbone.sync = function(method, model, options, error?) {
  return getSyncMethod(model).apply(this, [method, model, options, error]);
};

export default ChromeStorage;