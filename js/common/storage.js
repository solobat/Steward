/**
 * @file storage function set
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var h5 = {
        set: function (key, value) {
            localStorage[key] = value;
        },

        get: function (key) {
            return localStorage[key];
        }

    };

    function baseSet(type, data, cb) {
        chrome.storage[type].set(data, function () {
            cb.apply(this, arguments);
        });
    }

    function baseGet(type, key, cb) {
        chrome.storage[type].get(key, function () {
            cb.apply(this, arguments);
        });
    }

    var local = {
        set: function (data, cb) {
            baseSet('local', data, cb);
        },

        get: function (key, cb) {
            baseGet('sync', key, cb);
        }

    };

    var sync = {
        set: function (data, cb) {},

        get: function (key, cb) {}

    };

    module.exports = {
        h5: h5,
        local: local,
        sync: sync

    };
});
