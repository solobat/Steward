/**
 * @description jenkins plugin
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'

const version = 2;
const name = 'jenkins'
//'jk', 'jkb', 'jkc', 'jkw', 'jkset'
const keys = [
    { key: 'jk' },
    { key: 'jkb' },
    { key: 'jkc' },
    { key: 'jkw' },
    { key: 'jkset' }
];
const type = 'keyword';
const icon = chrome.extension.getURL('img/jenkins.png')
const title = chrome.i18n.getMessage(name + '_title')
const subtitle = chrome.i18n.getMessage(name + '_subtitle')
let SERVER_URL = window.localStorage['jenkins_url'] || ''
const commands = util.genCommands(name, icon, keys, type);
const keyUrlMap = {
    'jk': '',
    'jkb': 'build',
    'jkc': 'configure',
    'jkw': 'ws'
}
const actionTips = {
    seturl: {
        key: 'jkset',
        icon: icon,
        id: 'action-seturl',
        title: '设置jenkins url',
        desc: '输入jenkins url，回车确认'
    },
    errorurl: {
        key: 'jk',
        icon: icon,
        id: 'action-error',
        title: '获取不到jenkins jobs',
        desc: '请使用jkset设置正确的jenkins url',
        isWarn: true
    }
};

let jobs = [];

function getJobs() {
    if (jobs.length) {
        return new Promise((resolve, reject) => {
            resolve(jobs)
        })
    }

    return new Promise((resolve, reject) => {
        fetch(SERVER_URL + '/api/json?tree=jobs[name,url,color,healthReport[description,score,iconUrl]]')
            .then((resp) => resp.json())
            .then((results) => {
                jobs = results.jobs
                resolve(jobs)
            })
            .catch(() => {
                reject([actionTips['errorurl']])
            })
    })
}

function setUrl(iptval, callback) {
    if (!iptval) {
        callback('请输入url');
        return
    }

    if (iptval.endsWith('/')) {
        iptval = iptval.slice(0, -1)
    }

    if (iptval.indexOf('http://') === -1) {
        iptval = 'http://' + iptval
    }

    SERVER_URL = iptval
    window.localStorage['jenkins_url'] = SERVER_URL
    callback();
}

function showActionTips(action) {
    let actionTip = actionTips[action];

    if (!actionTip) {
        return;
    }

    return [{
        key: 'jk',
        icon: icon,
        id: actionTip.id,
        title: actionTip.title,
        desc: actionTip.desc
    }];
}

function onInput(key) {
    if (this.cmd === 'jkset') {
        return showActionTips('seturl');
    }

    if (!SERVER_URL) {
        this.render('jkset ');

        return;
    }

    return getJobs().then((results) => {
        var filterRE = new RegExp([].slice.call(key).join('\.\*'))

        var jobs = results.filter((job) => {
            return key ? !!job.name.match(filterRE) : true
        }).slice(0, 50)

        return jobs.map((item) => {
            return {
                key: key,
                id: item.url + keyUrlMap[this.cmd],
                icon: '/img/jenkins/' + (item.healthReport.length ? item.healthReport[0].iconUrl : 'nobuilt.png'),
                title: item.name,
                desc: item.healthReport.length ? item.healthReport[0].description : 'no build history',
                isWarn: item.healthReport.length && item.healthReport[0].score !== 100
            }
        });
    }).catch((results) => {
        return Promise.resolve(results);
    });
}

function onEnter({ id }) {
    if (id.startsWith('action-')) {
        let actionName = id.split('-')[1];

        if (actionName === 'seturl') {
            setUrl(this.query, (error) => {
                if (error) {
                    alert(error);
                } else {
                    alert('设置成功');
                    jobs = [];
                    this.render('jk ');
                }
            });
        }

        return;
    }

    if (id) {
        window.open(id)
    }
}

export default {
    version,
    name: 'Jenkins',
    icon,
    title,
    commands,
    onInput,
    onEnter
};
