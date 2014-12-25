define(['jquery', 'easycomplete', 'lib/pinyin'], function($, EasyComplete, pinyin) {
    function setEnabled(id, enabled) {
        chrome.management.setEnabled(id, enabled, function() {

        });
    }

    function findExtensions(key) {
        // TODO:
    }

    function getExtensions(key, enabled) {
        key = pinyin(key, {
            style: pinyin['STYLE_NORMAL']
        }).join('');

        chrome.management.getAll(function(extList) {
            var matchExts = extList.filter(function(ext) {
                var name = pinyin(ext.name.toLowerCase(), {
                    style: pinyin['STYLE_NORMAL']
                }).join('');

                return (!key || name.indexOf(key) > -1) && ext.enabled === enabled;
            });

            cmdbox.showItemList(matchExts);
        });
    }

    var cmdbox;

    function init() {
        $('.cmdbox').focus();
        var nowCmd = '';

        cmdbox = new EasyComplete({
            id: 'cmdbox',
            onkeyup: function(str) {
                nowCmd = '';

                if (!str.indexOf(' ')) {
                    return;
                }

                // WHY: why /g can not capture (.+)
                var reg = /^((?:on|off|find))\s(.*)$/i;
                var mArr = str.match(reg) || [];
                var cmd = mArr[1];
                var key = mArr[2];

                if (!cmd) {
                    cmdbox.clearList();
                    return;
                }
                if (cmd === 'find') {
                    findExtensions(key);

                    return;
                }

                var enabled = cmd === 'off';

                nowCmd = cmd;

                getExtensions(key.toLowerCase(), enabled);
            },

            onEnter: function() {
                var cmd = nowCmd;
                var id = $(this).data('id');

                if (cmd === 'on' || cmd === 'off') {
                    setEnabled(id, cmd === 'on');
                }
            },

            createItem: function(index, item) {
                var url = item.icons instanceof Array ? item.icons[0].url : '';

                return [
                    '<div data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
                    '<img class="ec-item-icon" src="' + url + '" alt="" />',
                    '<span class="ec-item-name">' + item.name + '</span>',
                    '</div>'
                ].join('');
            }
        });
    }

    return {
        init: init
    };
});