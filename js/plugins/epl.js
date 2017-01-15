/**
 * @file his command plugin script
 * @description 历史记录检索
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    var name = 'epl';
    var key = 'epl';
    var icon = chrome.extension.getURL('img/epl.png');
    var title = chrome.i18n.getMessage(name + '_title');
    var subtitle = chrome.i18n.getMessage(name + '_subtitle');
    var url = 'http://static.api.lesports.com/sms/v1/round/0/episodes?caller=1001&cid=20001&csid=100848002';

    function searchEpl(cmdbox, key, callback) {
        fetch(url).then(resp => resp.json()).then(resp => {
            callback(resp.data.episodes);
        });
    }

    function getMatchText(match) {
        let lt = match.competitors[0];
        let rt = match.competitors[1];

        return `${lt.name} ${lt.score} vs ${rt.score} ${rt.name}`;
    }

    function dataFormat(rawList) {
        return rawList.map(function (item) {
            return {
                key: key,
                id: item.id,
                icon: icon,
                title: getMatchText(item),
                desc: item.name,
                url: item.playLink

            };
        });
    }

    function onInput(key) {
        var that = this;
        searchEpl(that, key, function (matchUrls) {
            that.showItemList(dataFormat(matchUrls));
        });
    }

    function onEnter(id, elem) {
        window.open($(elem).data('url'));
    }

    module.exports = {
        key: 'epl',
        icon: icon,
        title: title,
        subtitle: subtitle,
        onInput: onInput,
        onEnter: onEnter
    };
});
