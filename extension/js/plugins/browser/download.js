/**
 * @description download
 * @author tomasy
 * @email solopea@gmail.com
 */

const chrome = window.chrome;
const version = 2;
const name = 'download';
const key = 'dl';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/download.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: true
}];

let timer = 0;
const QUERY_DELAY = 200;

function searchDownload(query, callback) {
    clearTimeout(timer);

    timer = setTimeout(function() {
        chrome.downloads.search({
            query: query ? [query] : [],
            limit: 10
          }, function (data) {
              const downloadList = data || [];

              callback(downloadList);
          });
    }, QUERY_DELAY);
}

const rFilename = /(?!\/)[^\/]+\.?(\w+)?$/;

function formatTitle (item) {
    const size = (item.fileSize / 1024 / 1024).toFixed(2);

    return [
        item.filename.match(rFilename)[0],
        '   [',
        `${size}Mb`,
        ']   ',
        (new Date(item.endTime)).toLocaleString()
    ].join('');
}
function onInput(query) {
    return new Promise(resolve => {
        searchDownload(query, function (downloadList) {
            const arr = [];
            let i;

            for (i in downloadList) {
                const item = downloadList[i];

                if (!item.filename) {
                  continue;
                }

                arr.push({
                    key,
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
    category: 'browser',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};
