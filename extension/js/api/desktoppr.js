import * as apiUtils from '../utils/api'

const BASE_URL = 'https://api.desktoppr.co/1/wallpapers';

export function getRandom() {
    return apiUtils.fetch(`${BASE_URL}/random`);
}