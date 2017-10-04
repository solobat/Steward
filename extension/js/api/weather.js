import * as apiUtils from '../utils/api'
import $ from 'jquery'

const BASE_URL = 'http://api.map.baidu.com/telematics/v3/weather';
const ak = '9b7365b2c5b07b133ad5dde5edf60db5';

export function getByCity(location) {
    if (!location) {
        return Promise.reject(null);
    }

    return fetch(BASE_URL + '?' + $.param({
        location,
        output: 'json',
        ak
    })).then(resp => resp.json());
}