/**
 * @description github urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import * as Websites from '../../helper/websites'

const version = 1;
const name = 'github';
const type = 'search';
const icon = chrome.extension.getURL('img/github.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const host = 'github.com';

const paths = [
    { name: 'github', path: '/' },
    { name: 'logout', path: '/logout'},
    { name: 'profile', deps: ['user'], path: '/{{user}}' },
    { name: 'repositories', deps: ['user'], path: '/{{user}}/?tab=repositories' },
    { name: 'stars', deps: ['user'], path: '/{{user}}/?tab=stars' },
    { name: 'followers', deps: ['user'], path: '/{{user}}/?tab=followers' },
    { name: 'following', deps: ['user'], path: '/{{user}}/?tab=following' },
    { name: 'notifications', path: '/notifications' },
    { name: 'Pull Requests', path: '/pulls' },
    { name: 'Issues', path: '/issues' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Explore', path: '/explore' },
    { name: 'Trending daily', path: '/trending'},
    { name: 'Trending weekly', path: '/trending?since=weekly'},
    { name: 'Trending monthly', path: '/trending?since=monthly'},
    { name: 'Watching', path: '/watching' },
    { name: 'new repository', path: '/new' },
    { name: 'Settings', path: '/settings' },
    { name: 'Account', path: '/settings/admin' },
    { name: 'Emails', path: '/settings/emails' },
    { name: 'Notifications', path: '/settings/notifications' },
    { name: 'Billing', path: '/settings/billing' },
    { name: 'SSH keys', path: '/settings/keys' },
    { name: 'Security', path: '/settings/security' },
    { name: 'Blocked Users', path: '/settings/blocked_users' },
    { name: 'Applications', path: '/settings/installations' },
    { name: 'Developer settings', path: '/settings/developers' }
];

function onInput(text) {
    const mapTo = key => item => {
        return {
            icon,
            key,
            title: item.name,
            desc: item.path,
            path: item.path,
            deps: item.deps
        }
    };

    if (text[0] === '/') {
        return Promise.resolve(Websites.filterByPath(paths, text).map(mapTo('action')));
    } else {
        return Promise.resolve(Websites.filterByName(paths, text).map(mapTo('action')));
    }
}

const deps = {};

function initDeps() {
    deps.user = document.querySelector('meta[name=user-login]').content;
}

function setup() {
    initDeps();

    window.addEventListener('message', event => {
        const { data } = event;

        if (data.action === 'command') {
            if (data.info.path) {
                Websites.handlePath(data.info.path, data.info, deps);
            }
        }
    });
}

export default {
    version,
    name,
    category: 'website',
    host,
    type,
    icon,
    title,
    onInput,
    setup
};