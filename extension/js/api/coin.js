import * as apiUtils from '../utils/api'
import storage from '../utils/storage'

const root = 'https://api.coinmarketcap.com/v2';
const STORAGE_KEY = 'coin_list';

export const list = () => {
    return storage.local.get(STORAGE_KEY).then(resp => {
        if (resp && resp.length) {
            return resp;
        } else {
            return apiUtils.fetch(apiUtils.url(root, '/listings')).then(results => {
                if (results.data) {
                    storage.local.set({
                        [STORAGE_KEY]: results.data
                    });

                    return results.data;
                } else {
                    return [];
                }
            });
        }
    });
};

export const price = (coinId = 1, convertTo = 'BTC') => {
    return apiUtils.fetch(apiUtils.url(root, `/ticker/${coinId}`), {
        convert: convertTo
    });
};
