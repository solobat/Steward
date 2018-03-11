import browser from 'webextension-polyfill'
import CONST from '../constant'

export default {
    key: CONST.STORAGE.THEMES,

    getData() {
        return browser.storage.sync.get(CONST.STORAGE.THEMES).then(resp => {
            return resp[CONST.STORAGE.THEMES];
        });
    },

    setData(themes) {
        if (themes) {
            return browser.storage.sync.set({
                [CONST.STORAGE.THEMES]: themes
            });
        } else {
            return Promise.resolve('no themes');
        }
    }
}