import $ from 'jquery'

const BASE_URL = 'https://api.map.baidu.com/telematics/v3/weather';
const ak = '9b7365b2c5b07b133ad5dde5edf60db5';

export function getByCity(location) {
    if (!location) {
        return Promise.reject(null);
    }

    const params = $.param({
        location,
        output: 'json',
        ak
    });

    return fetch(`${BASE_URL}?${params}`).then(resp => resp.json());
}