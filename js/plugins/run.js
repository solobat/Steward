define(function(require, exports, module) {
    var util = require('../common/util');

    function getExtensions(key, callback) {
        chrome.management.getAll(function(extList) {
            var matchExts = extList.filter(function(ext) {
                return util.matchText(key, ext.name) && ext.isApp;
            });

            callback(matchExts);
        });
    }

    function onInput(key) {
        var that = this;
        getExtensions(key.toLowerCase(), function(matchExts) {
            that.showItemList(matchExts);
        });
    }

    function launch(id) {
        chrome.management.setEnabled(id, true, function() {
            chrome.management.launchApp(id, function() {
                
            });
        });
    }

    function onEnter(id) {
        launch(id);
        this.refresh();
    }

    function createItem(index, item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';

        return [
            '<div data-type="ext" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + url + '" alt="" />',
            '<span class="ec-item-name">' + item.name + '</span>',
            '</div>'
        ];
    }

    module.exports = {
        onInput: onInput,
        onEnter: onEnter,
        createItem: createItem
    };
});