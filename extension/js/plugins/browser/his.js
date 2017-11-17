/**
 * @description find in history
 * @author tomasy
 * @email solopea@gmail.com
 */

const version = 2;
const name = 'history';
const key = 'his';
const type = 'keyword';
const icon = chrome.extension.getURL('img/history.png');
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

function searchHistory(query, callback) {
    chrome.history.search({
        text: query
    }, function (data) {
            let hisList = data || [];

            hisList = hisList.filter(function (his) {
                return Boolean(his.title);
            });

            callback(hisList);
        });
}

function dataFormat(rawList) {
    return rawList.map(function (item) {
        return {
            key: key,
            id: item.id,
            icon: icon,
            title: item.title,
            desc: item.url,
            url: item.url

        };
    });
}

function onInput(query) {
    return new Promise(resolve => {
        searchHistory(query, function (matchUrls) {
            resolve(dataFormat(matchUrls));
        });
    });
}

function onEnter(item) {
    chrome.tabs.create({
        url: item.url
    });
}

export default {
    version,
    name: 'History',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
