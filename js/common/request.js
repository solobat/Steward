/**
 * @file request
 * @description chrome通信包装
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    function emptyFn() {
    }

    function send(obj, callback) {
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
        chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
            cb.apply(null, arguments);
        });
    }

    module.exports = {
        send: send,
        log: log,
        get: get

    };
});
