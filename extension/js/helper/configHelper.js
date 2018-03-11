import browser from 'webextension-polyfill'

export default {
    key: 'config',

    getData() {
        return browser.storage.sync.get('config').then(resp => {
            return resp.config;
        });
    },

    setData(config) {
        if (config) {
            return browser.storage.sync.set({
                config
            });
        } else {
            return Promise.resolve('no config');
        }
    }
}