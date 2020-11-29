import * as apiUtils from '../utils/api'

const URL = `http://static.oksteward.com/steward-wallpaper.json?t=${Number(new Date())}`;

let cached;

export function getList() {
    if (cached) {
        return Promise.resolve(cached);
    } else {
        return apiUtils.fetch(URL).then(result => {
            cached = result;

            return cached;
        });
    }
}

export default function(getRandomOne) {
    return {
        name: 'selection',
        api: () => getList(),
        handle: result => getRandomOne(result.list),
        weight: 1
    };
}
