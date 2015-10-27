/**
 * @file dl command plugin script
 * @description 下载列表
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var chrome = window.chrome;
    var name = 'download';
    var key = 'dl';
    var icon = chrome.extension.getURL('img/download.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');

    function searchDownload(cmdbox, query, callback) {
        chrome.downloads.search({
          query: [query],
          orderBy: ['-endTime']
        }, function (downloadList) {
            downloadList = downloadList || [];

            callback(downloadList);
        });
    }

    var rFilename = /(?!\/)[^\/]+\.?(\w+)?$/;
    function formatTitle (item) {
      return [
        item.filename.match(rFilename)[0],
        '   [',
        (item.fileSize / 1024 / 1024).toFixed(2) + 'Mb',
        ']   ',
        (new Date(item.endTime)).toLocaleString()
      ].join('');
    }
    function onInput(key) {
        var that = this;
        searchDownload(that, key, function (downloadList) {
            var arr = [];
            for (var i in downloadList) {
                var item = downloadList[i];
                console.log(item);
                if (!item.filename) {
                  continue;
                }
                arr.push({
                    key: key,
                    id: item.id,
                    icon: icon,
                    url: item.url,
                    title: formatTitle(item),
                    desc: item.url,
                    isWarn: false

                });
            }
            that.showItemList(arr);
        });
    }

    function onEnter(id, elem) {
        chrome.downloads.show(id);
    }

    module.exports = {
        key: key,
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter

    };
});
