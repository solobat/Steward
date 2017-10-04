/**
 * @file weather plugin
 * @description powered by baidu weather api
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import { getByCity } from '../api/weather'

var version = 1;
var name = 'weather';
var key = 'tq';
var icon = chrome.extension.getURL('img/weather.png');
var indexIcon = chrome.extension.getURL('img/index.png');
var pm25Icon = chrome.extension.getURL('img/pm25.png');
var title = chrome.i18n.getMessage(name + '_title');
var subtitle = chrome.i18n.getMessage(name + '_subtitle');
var commands = [{
    key,
    title,
    subtitle,
    icon,
    editable: true
}];

function dataFormat(results) {
    let data = results.weather_data.map(item => {
        return {
            key: key,
            id: item.date,
            icon: item.dayPictureUrl,
            title: `${results.currentCity} ${item.weather} ${item.temperature} ${item.wind}`,
            desc: `${item.date}`
        }
    });
    let index = results.index.map(item => {
        return {
            key: key,
            id: item.tipt,
            title: `${item.tipt} ${item.zs}`,
            desc: item.des,
            icon: indexIcon
        }
    });
    let pm25 = {
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

function onInput(key) {
    let cityName = key;

    if (!cityName) {
        cityName = window.localStorage.getItem('location') || '北京';
    }

    clearTimeout(timer);

    if (!cityReg.test(cityName)) {
        return;
    }

    timer = setTimeout(() => {
        getByCity(cityName).then(resp => {
            if (resp.error) {
                this.clearList();
            } else {
                this.showItemList(dataFormat(resp.results[0]));
                window.localStorage.setItem('location', resp.results[0].currentCity);
            }
        })
    }, QUERY_DELAY);
}

function onEnter(id) {

}

export default {
    version,
    name: 'Weather',
    icon,
    title,
    commands,
    onInput: onInput,
    onEnter: onEnter
};
