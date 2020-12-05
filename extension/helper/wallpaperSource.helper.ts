import { WallpaperSource } from 'common/type';
import CONST from 'constant/index';
import bing from 'service/bing';
import desktoppr from 'service/desktoppr';
import nasa from 'service/nasa';
import picsum from 'service/picsum';
import pixabay from 'service/pixabay';
import selection from 'service/selection';
import storage from 'utils/storage';

function getRandomOne(list) {
  if (list && list.length) {
    const index = Math.round(Math.random() * (list.length - 1));

    return list[index];
  }
}

const sourceList = [bing, desktoppr, nasa, picsum, pixabay, selection];

const SOLID_COLORS = [
  '#f3a696',
  '#efcd9a',
  '#005e15',
  '#b4866b',
  '#7ebea5',
  '#a5cd89',
  '#fcf5f7',
  '#d8c6bc',
  '#574738',
  '#005baa',
  '#8cb155',
  '#5ac2d9',
  '#1e88a8',
  '#998c78',
  '#aa8c63',
  '#624498',
  '#f58f98',
  '#478384',
  '#858954',
  '#767c6b',
  '#a58f86',
  '#726250',
  '#f4a466',
  '#727171',
  '#c92e36',
  '#6f6f43',
  '#22825d',
  '#ada250',
  '#73b8e2',
  '#8491c3',
  '#b28c6e',
  '#864337',
  '#513743',
  '#b36c3c',
  '#888abc',
  '#400b36',
  '#373c38',
  '#c37854',
  '#824880',
  '#465d4c',
  '#ffd768',
  '#b48a76',
  '#595045',
  '#9ea1a3',
  '#f0b694',
  '#d3a243',
  '#00695b',
  '#606da1',
  '#0086cc',
  '#ee7948',
  '#00a497',
  '#405c36',
  '#7cc28e',
  '#b56c60',
  '#7065a3',
  '#eb9793',
  '#fcd4d5',
  '#c5591a',
  '#efbb2c',
  '#b0ca71',
  '#6c2c2f',
  '#f8eed1',
  '#71a4d9',
  '#8c6589',
  '#595455',
  '#5b7e91',
];

const favorites: WallpaperSource = {
  name: 'favorites',
  api: () => storage.sync.get(CONST.STORAGE.WALLPAPERS, []),
  handle: result => getRandomOne(result),
  weight: 2,
}

const solidcolor: WallpaperSource = {
  name: 'solidcolor',
  api: () => SOLID_COLORS,
  handle: result => getRandomOne(result),
  weight: 2,
}

type SourceTypes = 'bing' | 'desktoppr' | 'nasa' | 'picsum' | 'pixabay' | 'selection'
const sourcesInfo: {[props: string]: WallpaperSource | null} = {
  favorites,
  solidcolor,
  bing: null,
};

function install() {
  sourceList.forEach(source => {
    let result: WallpaperSource;

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

function randomIndex(sourceWeights: number[]) {
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
    tasks,
  };
}
