/**
 * @file request
 * @description a wrapper for message
 * @author tomasy
 * @email solopea@gmail.com
 */

function emptyFn() {
}

function send(obj, callback = () => {}) {
    chrome.extension.sendRequest(obj || {}, function (response) {
        callback(response);
    });
}

function log(msg) {
    send({
        msg: msg

    }, emptyFn);
}

function get(cb) {
    chrome.extension.onRequest.addListener(function (...args) {
        Reflect.apply(cb, null, args);
    });
}

export default {
    send,
    log,
    get
};
