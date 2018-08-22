import * as apiUtils from '../utils/api'

export const root = 'https://www.bing.com';
const baseParams = {
    format: 'js',
    idx: 0,
    n: 1,
    nc: Number(new Date()),
    mkt: 'zh-CN'
};
const MAX_IDX = 16;

function getRandom(to = MAX_IDX) {
    return Math.round(Math.random() * to);
}

export const today = () => {
    return apiUtils.fetch(apiUtils.url(root, '/HPImageArchive.aspx'), baseParams);
};

export const rand = () => {
    return apiUtils.fetch(apiUtils.url(root, '/HPImageArchive.aspx'), Object.assign({}, baseParams, {
        idx: getRandom()
    }));
};
