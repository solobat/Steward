/**
 * @description chrome urls
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../../common/util'

const version = 1;
const name = 'zhihu';
const type = 'search';
const icon = chrome.extension.getURL('img/zhihu.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const host = 'www.zhihu.com';

const paths = [
    { name: '首页', path: '/' },
    { name: '退出', path: '/logout'},
    { name: '发现', path: '/explore' },
    { name: '通知', path: '/notifications' },
    { name: '话题', path: '/topic' },
    { name: '话题广场', path: '/topics' },
    { name: 'Live', path: '/lives' },
    { name: '圆桌', path: '/roundtable' },
    { name: '付费咨询', path: '/zhi' },
    { name: '收藏', path: '/collections' },
    { name: '我的邀请', path: '/question/invited' },
    { name: '私信', path: '/inbox' },
    { name: '书店', path: '/pub' },
    { name: '设置', path: '/settings' },
    { name: '帐号和密码', path: '/settings/account' },
    { name: '消息和邮件', path: '/settings/notification' },
    { name: '屏蔽', path: '/settings/filter' },
    { name: '我关注的问题', path: '/question/following'},
    { name: '我的主页', deps: ['urltoken'], path: '/people/{{urltoken}}/' }, 
    { name: '我的回答', deps: ['urltoken'], path: '/people/{{urltoken}}/answers' },
    { name: '我的提问', deps: ['urltoken'], path: '/people/{{urltoken}}/asks' },
    { name: '我的文章', deps: ['urltoken'], path: '/people/{{urltoken}}/posts' },
    { name: '我的专栏', deps: ['urltoken'], path: '/people/{{urltoken}}/columns' },
    { name: '我的想法', deps: ['urltoken'], path: '/people/{{urltoken}}/pins' },
    { name: '我的收藏', deps: ['urltoken'], path: '/people/{{urltoken}}/collections' },
    { name: '我关注的人', deps: ['urltoken'], path: '/people/{{urltoken}}/following' },
    { name: '关注我的人', deps: ['urltoken'], path: '/people/{{urltoken}}/followers' },
    { name: '我关注的专栏', deps: ['urltoken'], path: '/people/{{urltoken}}/following/columns' },
    { name: '我关注的话题', deps: ['urltoken'], path: '/people/{{urltoken}}/following/topics' },
    { name: '我关注的问题', deps: ['urltoken'], path: '/people/{{urltoken}}/following/questions' },
    { name: '我关注的收藏', deps: ['urltoken'], path: '/people/{{urltoken}}/following/collections' }
];

function onInput(text) {
    const filterByName = item => util.matchText(text, item.name + item.path);
    const filterByPath = suggestions => util.getMatches(suggestions, text, 'path');
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
        return Promise.resolve(filterByPath(paths).map(mapTo('action')));
    } else {
        return Promise.resolve(paths.filter(filterByName).map(mapTo('action')));
    }
}

const deps = {};
const usertokenAttrName = 'data-zop-usertoken';

function initDeps() {
    const $usertoken = $(`[${usertokenAttrName}]`);
    const $currentUser = $('[data-name="current_user"]');

    if ($usertoken.length) {
        try {
            deps.urltoken = JSON.parse($usertoken.attr(usertokenAttrName)).urlToken;
        } catch (error) {
            console.log(error);
        }
    }

    if ($currentUser.length) {
        try {
            deps.urltoken = JSON.parse($currentUser.html())[1];
        } catch (error) {
            console.log(error);
        }
    }
}

function handlePath(path, info) {
    if (info.deps) {
        let realPath = path;

        info.deps.forEach(field => {
            realPath = realPath.replace(`{{${field}}}`, deps[field]);
        });

        window.location.href = realPath;
    } else {
        window.location.href = path;
    }
}

function setup() {
    initDeps();

    window.addEventListener('message', event => {
        const { data } = event;

        if (data.action === 'command') {
            if (data.info.path) {
                handlePath(data.info.path, data.info);
            }
        }
    });
}

export default {
    version,
    name,
    host,
    type,
    icon,
    title,
    onInput,
    setup
};