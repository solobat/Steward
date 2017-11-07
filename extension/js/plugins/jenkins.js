/**
 * @description jenkins plugin
 * @author tomasy
 * @email solopea@gmail.com
 */

import util from '../common/util'
import Toast from 'toastr'

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
const title = chrome.i18n.getMessage(`${name}_title`);
let SERVER_URL = window.localStorage.jenkins_url || ''
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
        title: 'set jenkins url',
        desc: 'input jenkins url，then press enter'
    },
    errorurl: {
        key: 'jk',
        icon: icon,
        id: 'action-error',
        title: 'can not fetch jenkins jobs',
        desc: 'please use jkset to set a valid jenkins url',
        isWarn: true
    }
};

let jobs = [];

function getJobs() {
    if (jobs.length) {
        return new Promise(resolve => {
            resolve(jobs)
        })
    }

    return new Promise((resolve, reject) => {
        fetch(`${SERVER_URL}/api/json?tree=jobs[name,url,color,healthReport[description,score,iconUrl]]`)
            .then(resp => resp.json())
            .then(results => {
                jobs = results.jobs
                resolve(jobs)
            })
            .catch(() => {
                reject([actionTips.errorurl])
            })
    })
}

function setUrl(query, callback) {
    let iptval = query;

    if (!iptval) {
        callback('please input an url');
        return
    }

    if (iptval.endsWith('/')) {
        iptval = iptval.slice(0, -1)
    }

    if (iptval.indexOf('http://') === -1) {
        iptval = `http://${iptval}`
    }

    SERVER_URL = iptval
    window.localStorage.jenkins_url = SERVER_URL
    callback();
}

function showActionTips(action) {
    const actionTip = actionTips[action];

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

    return getJobs().then(results => {
        const filterRE = new RegExp(Reflect.apply([].slice, key, []).join('\.\*'));

        const filteredJobs = results.filter(job => {
            return key ? Boolean(job.name.match(filterRE)) : true
        }).slice(0, 50)

        return filteredJobs.map(item => {
            const iconUrl = item.healthReport.length ? item.healthReport[0].iconUrl : 'nobuilt.png';

            return {
                key: key,
                id: item.url + keyUrlMap[this.cmd],
                icon: `/img/jenkins/${iconUrl}`,
                title: item.name,
                desc: item.healthReport.length ? item.healthReport[0].description : 'no build history',
                isWarn: item.healthReport.length && item.healthReport[0].score !== 100
            }
        });
    }).catch(results => {
        return Promise.resolve(results);
    });
}

function onEnter({ id }) {
    if (id.startsWith('action-')) {
        const actionName = id.split('-')[1];

        if (actionName === 'seturl') {
            setUrl(this.query, error => {
                if (error) {
                    Toast.error(error);
                } else {
                    Toast.success('set successfully');
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
