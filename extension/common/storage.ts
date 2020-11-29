/**
 * @file storage function set
 * @author tomasy
 * @email solopea@gmail.com
 */

const h5 = {
    set: function (key, value) {
        localStorage[key] = value;
    },

    get: function (key) {
        return localStorage[key];
    }
};

function baseSet(type, data, cb) {
    chrome.storage[type].set(data, function (...args) {
        Reflect.apply(cb, this, args);
    });
}

function baseGet(type, key, cb) {
    chrome.storage[type].get(key, function (...args) {
        Reflect.apply(cb, this, args);
    });
}

const local = {
    set: function (data, cb) {
        baseSet('local', data, cb);
    },

    get: function (key, cb) {
        baseGet('sync', key, cb);
    }
};

const sync = {
    set: function (data, cb) {
        baseSet('sync', data, cb);
    },

    get: function (key, cb) {
        baseGet('sync', key, cb);
    }
};

export default {
    h5,
    local,
    sync
};
