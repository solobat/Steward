import storage from '../utils/storage'
import CONST from '../constant'
import bing from '../api/bing'
import desktoppr from '../api/desktoppr'
import nasa from '../api/nasa'
import picsum from '../api/picsum'
import pixabay from '../api/pixabay'

function getRandomOne(list) {
    if (list && list.length) {
        const index = Math.round(Math.random() * (list.length - 1));

        return list[index];
    }
}

const sourceList = [
    bing,
    desktoppr,
    nasa,
    picsum,
    pixabay
];

const SOLID_COLORS = [
    '#009688',
    '#00acc1',
    '#0f6cb2',
    '#0f6bb3',
    '#19a5aa',
    '#3f51b5',
    '#303f9f',
    '#423c92',
    '#424242',
    '#5e35b1',
    '#607d8b',
    '#7e57c2',
    '#c5cae9',
    '#ff8f00',
    '#ff9e80',
    '#ff6e40'
];

const sourcesInfo = {
    favorites: {
        name: 'favorites',
        api: () => storage.sync.get(CONST.STORAGE.WALLPAPERS, []),
        handle: result => getRandomOne(result),
        weight: 2
    },
    solidcolor: {
        name: 'solidcolor',
        api: () => SOLID_COLORS,
        handle: result => getRandomOne(result),
        weight: 2
    }
};

function install() {
    sourceList.forEach(source => {
        let result;

        if (typeof source === 'function') {
            result = source(getRandomOne);
        } else {
            result = source;
        }

        if (result && result.name) {
            sourcesInfo[result.name] = result;
        }
    });
}

export function getAllSources() {
    install();

    return sourcesInfo;
}

function randomIndex(sourceWeights) {
    const list = [];

    sourceWeights.forEach((weight, index) => {
        for (let windex = 0; windex < weight; windex += 1) {
            list.push(index);
        }
    });

    return getRandomOne(list);
}

export function getSources(method) {
    let sources = window.stewardCache.config.general.wallpaperSources.slice(0);

    // default
    if (!sources || !sources.length) {
        sources = ['bing', 'favorites'];
    }

    const sourceWeights = sources.map(item => sourcesInfo[item].weight);
    const index = randomIndex(sourceWeights);
    const sourceName = sources[index];
    const source = sourcesInfo[sourceName];
    const tasks = [];

    if (sourceName === 'bing') {
        tasks.push(source.api(method));
        tasks.push(sourcesInfo.favorites.api);
    } else if (sourceName === 'favorites') {
        // there may be no pictures in the `favorites`
        tasks.push(sourcesInfo.bing.api(method));
        tasks.push(source.api);
    } else {
        tasks.push(source.api);
        tasks.push(sourcesInfo.favorites.api);
    }

    return {
        name: sourceName,
        tasks
    };
}