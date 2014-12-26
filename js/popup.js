define(['jquery', 'easycomplete', 'lib/pinyin'], function($, EasyComplete, pinyin) {

    function getPinyin(name) {
        return pinyin(name, {
            style: pinyin['STYLE_NORMAL']
        }).join('');
    }

    function setEnabled4Ext(id, enabled) {
        chrome.management.setEnabled(id, enabled, function() {

        });
    }

    function findExtensions(key) {
        // TODO:
    }

    function getExtensions(key, enabled, callback) {
        key = pinyin(key, {
            style: pinyin['STYLE_NORMAL']
        }).join('');

        chrome.management.getAll(function(extList) {
            var matchExts = extList.filter(function(ext) {
                return matchText(key, ext.name) && ext.enabled === enabled;
            });

            callback(matchExts);
        });
    }

    function selectTab(id) {
        chrome.tabs.update(id, {
            active: true
        });
    }

    function getAllTabs(key, callback) {
        chrome.windows.getAll(function(wins) {
            if (!wins.length) {
                return;
            }
            var matchTabs = [];
            for (var i = 0, len = wins.length; i < len; i++) {

                // 闭包
                (function(index) {
                    chrome.tabs.getAllInWindow(wins[index].id, function(tabs) {
                        var tabList = tabs.filter(function(tab) {
                            return matchText(key, tab.title);
                        });
                        
                        matchTabs = matchTabs.concat(tabList);

                        if (index === len - 1) {
                            callback(matchTabs);
                        }
                    });
                })(i);
            }
        });
    }

    function matchText(key, text) {
        text = getPinyin(text.toLowerCase());

        if (!key) {
            return true;
        }

        if (text.indexOf(key) > -1) {
            return true;
        }

        var plainKey = key.replace(/\s/g, '');
        var reg = new RegExp('.*' + plainKey.split('').join('.*') + '.*');

        return reg.test(text);
    }

    var cmdbox;

    function init() {
        $('.cmdbox').focus();
        var nowCmd = '';

        cmdbox = new EasyComplete({
            id: 'cmdbox',
            oninput: function(str) {
                nowCmd = '';

                if (!str.indexOf(' ')) {
                    return;
                }

                // WHY: why /g can not capture (.+)
                var reg = /^((?:on|off|find|tab))\s(.*)$/i;
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var key = mArr[2];

                if (!cmd) {
                    cmdbox.clearList();
                    return;
                }

                nowCmd = cmd;

                if (cmd === 'find') {
                    findExtensions(key);

                    return;
                }

                if (cmd === 'tab') {
                    getAllTabs(key, function(matchTabs) {
                        cmdbox.showItemList(matchTabs);
                    });

                    return;
                }

                var enabled = cmd === 'off';

                getExtensions(key.toLowerCase(), enabled, function(matchExts) {
                    cmdbox.showItemList(matchExts);
                });
            },

            onEnter: function() {
                var cmd = nowCmd;
                var id = $(this).data('id');

                if (cmd === 'on' || cmd === 'off') {
                    setEnabled4Ext(id, cmd === 'on');
                    cmdbox.refresh();
                } else if (cmd === 'tab') {
                    selectTab(id);
                }
            },

            createItem: function(index, item) {
                if (nowCmd === 'tab') {
                    return createTabItem(index, item);
                } else {
                    return createExtensionItem(index, item);
                }
            }
        });
    }

    function createTabItem(index, item) {
        return [
            '<div data-type="tab" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + item.favIconUrl + '" alt="" />',
            '<span class="ec-item-name">' + item.title + '</span>',
            '</div>'
        ].join('');
    }

    function createExtensionItem(index, item) {
        var url = item.icons instanceof Array ? item.icons[0].url : '';

        return [
            '<div data-type="ext" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
            '<img class="ec-item-icon" src="' + url + '" alt="" />',
            '<span class="ec-item-name">' + item.name + '</span>',
            '</div>'
        ].join('');
    }

    return {
        init: init
    };
});