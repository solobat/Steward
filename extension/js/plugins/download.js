/**
 * @file dl command plugin script
 * @description 下载列表
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'

const chrome = window.chrome;
const version = 2;
const name = 'download';
const key = 'dl';
const type = 'keyword';
const icon = chrome.extension.getURL('img/download.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

function searchDownload(query, callback) {
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
    return new Promise((resolve) => {
        searchDownload(key, function (downloadList) {
            let arr = [];

            for (let i in downloadList) {
                let item = downloadList[i];
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

            resolve(arr);
        });
    });
}

function onEnter(item) {
    chrome.downloads.show(item.id);
}

export default {
    version,
    name: 'Downloads',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
