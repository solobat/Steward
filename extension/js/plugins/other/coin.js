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
let coinMap;

function getCoinState(coinSymbol) {
    const fixedSymbol = coinSymbol.toUpperCase();

    if (coinMap) {
        return Promise.resolve(coinMap[fixedSymbol]);
    } else {
        return storage.local.get('coin_map').then(resp => {
            coinMap = resp || {};

            return coinMap[fixedSymbol];
        });
    }
}

function setCoinState(coinSymbol, newState) {
    const oldState = coinMap[coinSymbol] || {};

    coinMap[coinSymbol] = Object.assign(oldState, newState);

    return storage.local.set({
        coin_map: coinMap
    });
}

function getCachedCoinState(coinSymbol) {
    if (Number(coinSymbol)) {
        return Promise.resolve({
            id: Number(coinSymbol)
        });
    } else {
        return getCoinState(coinSymbol).then(coinState => {
            return coinState || {};
        });
    }
}

function getCoinInfoBySymbol(coinSymbol) {
    function searchInList() {
        return getCachedCoinState(coinSymbol).then(coinState => {
            const findFn = coinState.id ? coin => coin.id === coinState.id : coin => coin.symbol === coinSymbol;

            return {
                info: coinList.find(findFn),
                state: coinState
            };
        });
    }

    if (coinList) {
        return searchInList();
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
    const coinSymbol = (arr[0] || 'BTC').toUpperCase();
    const convertTo = (arr[1] || '').toUpperCase();
    const ex = arr[2];

    if (!convertTo || supportConverts.indexOf(convertTo) !== -1) {
        return getCoinInfoBySymbol(coinSymbol).then(({ info, state }) => {
            if (info) {
                const fixedConvert = convertTo || state.convertTo || 'BTC';
                const fixedEx = ex || state.ex || 'okex';

                return coinApi.price(info.id, fixedConvert).then(resp => {
                    const data = resp.data;

                    if (data.quotes) {
                        const items = [];

                        for (const key in data.quotes) {
                            const item = data.quotes[key];

                            items.push({
                                key: 'coins',
                                id: key,
                                icon,
                                title: `${info.symbol} ==> ${item.price}/${key}`,
                                desc: `${item.percent_change_1h || 0}%[1h] -- ${item.percent_change_24h}%[24h] -- ${item.percent_change_7d}%[7d]`,
                                state: {
                                    id: info.id,
                                    coinSymbol: data.symbol,
                                    convertTo: key,
                                    ex: fixedEx
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
    },
    huobi: {
        urlFn: (coinSymbol, convertTo) => `https://www.huobi.br.com/${coinSymbol}_${convertTo}/exchange/`,
        converts: ['btc', 'usdt', 'eth', 'ht']
    },
    hadax: {
        urlFn: (coinSymbol, convertTo) => `https://www.hadax.com/coin_coin/exchange/#${coinSymbol}_${convertTo}`,
        converts: ['btc', 'eth', 'ht']
    },
    binance: {
        urlFn: (coinSymbol, convertTo) => `https://www.binance.com/trade/${coinSymbol}_${convertTo}`,
        converts: ['btc', 'eth', 'usdt', 'bnb']
    },
    fcoin: {
        urlFn: (coinSymbol, convertTo) => `https://exchange.fcoin.com/ex/main/${coinSymbol}-${convertTo}`,
        converts: ['btc', 'eth', 'usdt']
    }
};

function getTradeUrl(coinSymbol = 'btc', convertTo = 'usdt', ex = 'okex') {
    const exConf = exMap[ex];
    const realConvert = convertTo.toLowerCase() === 'usd' ? 'usdt' : convertTo.toLowerCase();
    const fixedConvert = exConf.converts.indexOf(realConvert) !== -1 ? realConvert : exConf.converts[0];

    return exConf.urlFn(coinSymbol, fixedConvert);
}

function onEnter(item, { orkey }) {
    if (orkey === 'coins') {
        setCoinState(item.title.toUpperCase(), {
            id: item.id
        });

        return Promise.resolve(`coin ${item.id}`);
    } else if (orkey === 'coin') {
        chrome.tabs.create({ url: getTradeUrl(item.state.coinSymbol, item.state.convertTo, item.state.ex), active: true });
        setCoinState(item.state.coinSymbol, item.state);
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
