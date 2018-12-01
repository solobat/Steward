import * as apiUtils from '../utils/api'

const BASE_URL = 'https://api.desktoppr.co/1/wallpapers';

export function getRandom() {
    return apiUtils.fetch(`${BASE_URL}/random`);
}

export default {
    name: 'desktoppr',
    api: () => getRandom(),
    handle: result => result.response.image.url,
    weight: 3
}
