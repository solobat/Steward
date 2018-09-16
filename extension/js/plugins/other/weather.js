/**
 * @description powered by baidu weather api
 * @author tomasy
 * @email solopea@gmail.com
 */

import { getByCity } from '../../api/weather'

const version = 2;
const name = 'weather';
const key = 'tq';
const type = 'keyword';
const icon = chrome.extension.getURL('iconfont/weather.svg');
const indexIcon = chrome.extension.getURL('iconfont/index.svg');
const pm25Icon = chrome.extension.getURL('iconfont/pm25.svg');
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

function dataFormat(results) {
    const data = results.weather_data.map(item => {
        return {
            key: key,
            id: item.date,
            icon: item.dayPictureUrl,
            title: `${results.currentCity} ${item.weather} ${item.temperature} ${item.wind}`,
            desc: `${item.date}`
        }
    });
    const index = results.index.map(item => {
        return {
            key: key,
            id: item.tipt,
            title: `${item.tipt} ${item.zs}`,
            desc: item.des,
            icon: indexIcon
        }
    });
    const pm25 = {
        key: key,
        id: 'pm2.5',
        title: `pm2.5: ${results.pm25}`,
        desc: results.pm25 > 100 ? '空气不好，请备好防护措施' : '空气不错，出去转转吧',
        icon: pm25Icon
    }

    return [
        data[0], data[1],
        pm25,
        ...index
    ];
}

const QUERY_DELAY = 200;
let timer = 0;
const cityReg = /^[\u4e00-\u9fa5]{2,}$/;

function onInput(query) {
    let cityName = query;

    if (!cityName) {
        cityName = window.localStorage.getItem('location') || '北京';
    }

    clearTimeout(timer);

    if (!cityReg.test(cityName)) {
        return;
    }

    return new Promise(resolve => {
        timer = setTimeout(() => {
            getByCity(cityName).then(resp => {
                if (resp.error) {
                    resolve();
                } else {
                    resolve(dataFormat(resp.results[0]));
                    window.localStorage.setItem('location', resp.results[0].currentCity);
                }
            })
        }, QUERY_DELAY);
    });
}

function onEnter() {

}

export default {
    version,
    name: 'Weather',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true
};
