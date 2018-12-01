import * as apiUtils from '../utils/api'

const STORAGE_KEY = 'picsumids';

export const root = 'https://picsum.photos';

export function getList() {
    return apiUtils.fetch(`${root}/list`);
}

export function refreshPicsumList() {
    getList().then(resp => {
        if (resp && resp.length) {
            const ids = resp.map(item => item.id);

            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
            } catch (error) {
                console.log(error);
            }
        }
    });
}

function getIds() {
    try {
        return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
        console.log(error);

        return [0];
    }
}

const IMAGE_BASE_URL = `${root}/1920/1080?image=`;

export function getRandomImage() {
    const ids = getIds();

    if (ids && ids.length) {
        const index = Math.round(Math.random() * (ids.length - 1));

        return Promise.resolve(`${IMAGE_BASE_URL}${ids[index]}`);
    } else {
        return Promise.resolve(`${IMAGE_BASE_URL}0`);
    }
}

export default {
    name: 'picsum',
    api: () => getRandomImage(),
    handle: result => result,
    weight: 2
}
