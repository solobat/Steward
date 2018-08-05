/**
 * @description powered by coinmarketcap.com api
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../../common/util'
import * as coinApi from '../../api/coin'
import storage from '../../utils/storage'

const version = 1;
const name = 'coin';
const type = 'keyword';
const keys = [{ key: 'coins'}, { key: 'coin'}];
const icon = chrome.extension.getURL('img/btc.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const commands = util.genCommands(name, icon, keys, type);
const supportConverts = ['AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PKR', 'PLN', 'RUB', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'ZAR', 'BTC', 'ETH', 'XRP', 'LTC', 'BCH'];

let coinList;

function getCoinInfoBySymbol(coinSymbol) {
    function searchInList() {
        return storage.local.get('coin_map').then(resp => {
            let id = parseInt(coinSymbol, 10);
            const coinMap = resp || {};
            const fixedSymbol = coinSymbol.toUpperCase();

            if (coinMap[fixedSymbol]) {
                id = coinMap[fixedSymbol];
            }

            const findFn = id ? coin => coin.id === id : coin => coin.symbol === fixedSymbol;

            return coinList.find(findFn);
        });
    }

    if (coinList) {
        return Promise.resolve(searchInList());
    } else {
        return coinApi.list().then(coins => {
            coinList = coins;

            return searchInList();
        });
    }
}

function queryCoins(query) {
    return coinApi.list().then(coins => {
        return coins.filter(function (coin) {
            return util.matchText(query, coin.symbol + coin.name + coin.website_slug);
        }).map(coin => {
            return {
                key: 'coins',
                id: coin.id,
                icon,
                title: coin.symbol,
                desc: coin.name
            };
        }).slice(0, 50);
    });
}

function queryCoin(query) {
    const arr = query.split(/[_\s]/);
    const coinSymbol = arr[0] || 'BTC';
    const convertTo = arr[1] || 'BTC';

    if (supportConverts.indexOf(convertTo.toUpperCase()) !== -1) {
        return getCoinInfoBySymbol(coinSymbol).then(coinInfo => {
            if (coinInfo) {
                return coinApi.price(coinInfo.id, convertTo).then(resp => {
                    const data = resp.data;

                    if (data.quotes) {
                        const items = [];

                        for (const key in data.quotes) {
                            const item = data.quotes[key];

                            items.push({
                                key: 'coins',
                                id: key,
                                icon,
                                title: `${coinInfo.symbol} ==> ${item.price}/${key}`,
                                desc: `${item.percent_change_1h || 0}%[1h] -- ${item.percent_change_24h}%[24h] -- ${item.percent_change_7d}%[7d]`,
                                data: {
                                    coinSymbol: data.symbol.toLowerCase(),
                                    convertTo: key.toLowerCase()
                                }
                            });
                        }

                        return items;
                    } else {
                        return [];
                    }
                });
            } else {
                return [];
            }
        });
    }
}

function onInput(query, command) {
    const { orkey } = command;

    if (orkey === 'coins') {
        return queryCoins(query);
    } else if (orkey === 'coin') {
        return queryCoin(query);
    }
}

const exMap = {
    okex: {
        urlFn: (coinSymbol, convertTo) => `https://www.okex.com/spot/trade#product=${coinSymbol}_${convertTo}`,
        converts: ['btc', 'usdt', 'eth', 'okb']
    }
};

function getTradeUrl(coinSymbol = 'btc', convertTo = 'usdt', ex = 'okex') {
    const exConf = exMap[ex];
    const fixedConvert = exConf.converts.indexOf(convertTo) !== -1 ? convertTo : 'usdt';

    return exConf.urlFn(coinSymbol, fixedConvert);
}

function updateCache(id, coinSymbol) {
    storage.local.get('coin_map').then(resp => {
        const coinMap = resp ? resp : {};

        coinMap[coinSymbol] = id;
        storage.local.set({
            coin_map: coinMap
        });
    });
}

function onEnter(item, { orkey }) {
    if (orkey === 'coins') {
        updateCache(item.id, item.title);

        return Promise.resolve(`coin ${item.id}`);
    } else if (orkey === 'coin') {
        chrome.tabs.create({ url: getTradeUrl(item.data.coinSymbol, item.data.convertTo), active: true });
    }
}

export default {
    version,
    name: 'Coin Market',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: true
};
