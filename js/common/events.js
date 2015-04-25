/**
 * @file chrome events
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var events = {
        tabs: {
            onRemoved: function (cb) {
                chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
                    cb.apply(null, arguments);
                });
            },

            onCreated: function (cb) {
                chrome.tabs.onCreated.addListener(function (tab) {
                    cb.apply(null, arguments);
                });
            }

        },

        windows: {
            onCreated: function (cb) {
                chrome.windows.onCreated.addListener(function (win) {
                    cb.apply(null, arguments);
                });
            }

        }

    };

    function trigger(obj, actionFn) {
        $.each(obj, function (eventType, eventList) {
            if (!eventList.length) {
                return;
            }

            var allTypeEvents = events[eventType];
            for (var i = 0, len = eventList.length; i < len; i++) {
                allTypeEvents[eventList[i]](actionFn);
            }
        });
    }

    module.exports = {
        on: trigger

    };
});
