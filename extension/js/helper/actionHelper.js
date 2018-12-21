import PageCommand from '../../js/enum/pageCommand'
import browser from 'webextension-polyfill'

const defaultActions = [{
    title: 'Copy title as a markdown link',
    actionType: PageCommand.COPY,
    extend: {
        template: '[{{title}}]({{url}})'
    },
    enable: true
}, {
    title: 'Copy selection text as a markdown link',
    actionType: PageCommand.COPY,
    extend: {
        template: '[{{selection}}]({{url}})'
    },
    enable: false
}, {
    title: 'Toggle TODO',
    desc: 'Add a bookmark and tag it with a TODO prefix / Remove bookmark',
    actionType: PageCommand.TOGGLE_TODO,
    enable: true
}, {
    title: 'Toggle protection status',
    actionType: PageCommand.PAGE_PROTECT,
    desc: 'Not protected',
    extend: {
        protected: false
    },
    enable: true
}];

const GLOBAL_ACTIONS_KEY = 'global_actions';

export function getAllGlobalActions() {
    return browser.storage.local.get(GLOBAL_ACTIONS_KEY).then(resp => {
        if (resp[GLOBAL_ACTIONS_KEY]) {
            return resp[GLOBAL_ACTIONS_KEY];
        } else {
            return defaultActions;
        }
    });
}

export function getGlobalActions() {
    return getAllGlobalActions().then(resp => resp.filter(item => item.enable));
}

export function setGlobalActions(jsonStr) {
    try {
        const actions = JSON.parse(jsonStr);

        return browser.storage.local.set({
            [GLOBAL_ACTIONS_KEY]: actions
        });
    } catch (error) {
        return Promise.reject('parse error');
    }
}