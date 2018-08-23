import CONST from '../../../js/constant'
import previewHtml from '../preview.html'
import * as defaultThemems from '../../../js/conf/themes'
import storage from '../../../js/utils/storage'

const appearanceItems = CONST.OPTIONS.APPEARANCE_ITEMS;

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export default {
    data() {
        return {
            curApprItem: null,
            appearanceItems,
            previewHtml,
            themeMode: '',
            themes: clone(defaultThemems),
            themeContainerStyles: {}
        };
    },

    computed: {
        theme() {
            return this.themes[this.themeMode];
        }
    },

    watch: {
        themeMode(newMode) {
            this.applyTheme(newMode);
        }
    },

    methods: {
        updateApprItem(apprItem) {
            this.curApprItem = apprItem;
            const mode = apprItem.name.replace(' ', '').toLowerCase();

            this.themeMode = mode;
        },

        handleApprItemClick: function(apprItem) {
            this.updateApprItem(apprItem);
        },

        loadThemes() {
            return storage.sync.get(CONST.STORAGE.THEMES).then(themes => {
                if (themes) {
                    this.themes = themes;
                }
            });
        },

        saveThemes() {
            window.localStorage.setItem('themes', JSON.stringify(this.themes));
            storage.sync.set({
                [CONST.STORAGE.THEMES]: this.themes
            }).then(() => {
                console.log('save themes successfully...');
            });
        },

        handleThemeSave(mode) {
            this.applyTheme(mode);

            this.saveThemes();
        },

        handleThemeReset(mode) {
            this.themes[mode] = Object.assign({}, defaultThemems[mode]);
            this.applyTheme(mode);
            this.saveThemes();
        },

        getColorType(mode) {
            if (mode === 'popup') {
                return false;
            } else {
                return true;
            }
        },

        applyTheme(mode) {
            const theme = this.themes[mode] || this.defaultThemems[mode];

            if (theme) {
                const themeConfig = Object.assign({}, theme);
                const wallpaper = this.selectedWallpaper || 'http://www.bing.com/az/hprichbg/rb/MatusevichGlacier_EN-US13620113504_1920x1080.jpg';

                if (mode === 'newtab') {
                    themeConfig['--app-newtab-background-image'] = `url(${wallpaper})`;
                    this.themeContainerStyles = {
                        background: 'var(--app-newtab-background-image) center center / cover no-repeat'
                    };
                } else {
                    this.themeContainerStyles = {};
                }

                let cssText = '';

                for (const prop in themeConfig) {
                    cssText += `${prop}: ${themeConfig[prop]};`;
                }

                document.querySelector('html').style.cssText = cssText;
            }
        }
    }
}