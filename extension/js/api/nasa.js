import * as apiUtils from '../utils/api'

const KEY = 'kxwrn5RQGnJVYU5wwipadjsGjOSrEGbyEihSZcqY';
const URL = 'https://api.nasa.gov/planetary/apod'

export function getList() {
    return apiUtils.fetch(URL, { api_key: KEY });
}
