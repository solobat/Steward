/**
 * @file chrome events
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'

const events = {
    tabs: {
        onRemoved: function (cb) {
            chrome.tabs.onRemoved.addListener(function (...args) {
                Reflect.apply(cb, null, args);
            });
        },

        onCreated: function (cb) {
            chrome.tabs.onCreated.addListener(function (...args) {
                Reflect.apply(cb, null, args);
            });
        }
    },

    windows: {
        onCreated: function (cb) {
            chrome.windows.onCreated.addListener(function (...args) {
                Reflect.apply(cb, null, args);
            });
        }
    }
};

function trigger(obj, actionFn) {
    $.each(obj, function (eventType, eventList) {
        if (!eventList.length) {
            return;
        }

        const allTypeEvents = events[eventType];
        for (let i = 0, len = eventList.length; i < len; i = i + 1) {
            allTypeEvents[eventList[i]](actionFn);
        }
    });
}

export default {
    on: trigger
};