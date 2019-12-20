import Vue from 'vue'
import ElementUI from 'element-ui'
import App from './App.vue';
import 'element-ui/lib/theme-default/index.css'
import util from '../../js/common/util'
import * as i18n from '../../js/info/i18n'
import CONST from '../../js/constant'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;

Vue.use(ElementUI);

const getConfig = util.getData('getConfig');

function init() {
    Promise.all([
        getConfig()
    ]).then(([config]) => {
        const tips = CONST.I18N.TIPS;

        config.lastVersion = config.version || version;

        const i18nTexts = getI18nTexts({general: config.general, tips});

        i18nTexts.ui = i18n;

        render(config, i18nTexts);
    });
}

function getI18nTexts(obj, prefix) {
    try {
        if (typeof obj === 'object' && !(obj instanceof Array)) {
            const ret = {};

            for (const key in obj) {
                const nextPrefix = prefix ? `${prefix}_${key}` : key;

                ret[key] = getI18nTexts(obj[key], nextPrefix);
            }
            return ret;
        } else {
            return chrome.i18n.getMessage(prefix)
        }
    } catch (e) {
        console.log(e);
        return {};
    }
}

function render({general, plugins, lastVersion}, i18nTexts) {
    let activeName = 'general';

    if (lastVersion < version) {
        activeName = 'update';
    }

    const fromTab = util.getParameterByName('tab');

    if (fromTab) {
        activeName = fromTab.toLowerCase();
    }

    if (activeName === 'steward') {
        activeName = 'general';
    }

    new Vue({
        el: '#app',
        data: {
            activeName,
            config: {
                general,
                plugins,
                version
            },
            i18nTexts
        },
        components: { App },
        template: '<App :config="config" :i18nTexts="i18nTexts" :tabName="activeName" />'
    });
}

init();