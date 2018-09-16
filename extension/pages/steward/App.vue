<template>
    <div class="container">
        <header id="header">
            <shortcuts :shortcuts="shortcuts" v-if="widgets.includes('shortcuts')" />
        </header>
        <transition name="fade">
            <application v-show="visible" mode="newTab" :in-content="false" />
        </transition>
        <clock v-if="widgets.includes('clock')" />
        <footer></footer>
        <div class="fixed-tools" :class="{'auto-hide': !widgets.includes('wpbtns')}">
            <span id="j-save-wplink" class="save-wplink action-btn" title="save wallpaper link"
                :class="[wallpaper.isNew ? 'save' : 'saved']"
                @click="handleWpSaveClick"></span>
            <span id="j-refresh-wp" class="refresh-wp action-btn" title="refresh wallpaper"
                @click="handleWpRefreshClick"></span>
        </div>
    </div>
</template>
<script>
import application from '../../components/application/index.vue'
import clock from '../../components/clock/index.vue'
import shortcuts from '../../components/shortcuts/index.vue'
import * as Core from '../../js/main/main.js'
import * as Wallpaper from '../../js/main/wallpaper.js'
import util from '../../js/common/util'
import keyboardJS from 'keyboardjs'

function getShortcuts(shortcutsConfig) {
    let arr = [];

    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(index => {
        const conf = shortcutsConfig[`pageboxShortcut_${index}`];

        if (conf.cmd) {
            arr.push(conf.cmd);
        }
    });

    return arr.slice(0, 5);
}

export default {
    name: 'App',
    data() {
        const general = this.$root.config.general;

        return {
            wallpaper: {
                isNew: true
            },
            visible: true,
            widgets: general.newtabWidgets || [],
            shortcuts: getShortcuts(general.shortcuts)
        };
    },
    components: {
        application,
        clock,
        shortcuts
    },

    created() {
        this.bindEvents();
        Wallpaper.init();
    },

    methods: {
        bindEvents() {
            this.$root.$on('wallpaper:refreshed', (isNew) => {
                this.wallpaper.isNew = isNew;
            });

            this.$root.$on('wallpaper:update', (event, url) => {
                Wallpaper.update(url, true);
            });

            this.$root.$on('apply:command', () => {
                this.visible = true;
            });

            const keyType = util.isMac ? 'command' : 'alt';

            keyboardJS.bind(`${keyType} + right`, event => {
                this.visible = !this.visible;
            });
        },

        handleWpSaveClick() {
            if (this.wallpaper.isNew) {
                Wallpaper.save();
            } else {
                Wallpaper.remove();
            }
        },

        handleWpRefreshClick() {
            Wallpaper.refresh();
        }
    }
}
</script>

<style lang="scss">
@import '../../scss/main.scss';
@import '../../scss/themes/newtab/classical.scss';

.box-invisible {
    .main {
        display: none;
    }
}

body {
    margin: 0;
    padding: 0;
    height: 100vh;
    background-color: var(--newtab-background-color);

    user-select: none;
    box-sizing: border-box;

    * {
        box-sizing: inherit;
    }
}

.container {
    height: 100vh;
}

img {
    vertical-align: top;
}

a {
    text-decoration: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s
}

.fade-enter, .fade-leave-to {
  opacity: 0
}

#header {
    height: 80px;
}

.fixed-tools {
    position: fixed;
    bottom: 10px;
    width: 100%;
    padding: 0 10px;
    z-index: 100;

    &.auto-hide {
        .action-btn {
            opacity: 0;
        }

        &:hover {
            .action-btn {
                opacity: 1;
            }
        }
    }

    &:hover {
        .action-btn {
            opacity: .7;
        }
    }
}

.action-btn {
    display: block;
    width: 20px;
    height: 20px;
    cursor: pointer;
    opacity: 1;
    transition: all .2s;
}

.save-wplink {
    float: left;
    background: url(../../svg/star.svg);
    background-size: cover;

    &.saved {
        background-image: url(../../svg/star-fill.svg);
    }
}

.save-wplink:hover {
    background-image: url(../../svg/star-fill.svg);
}

.refresh-wp {
    float: right;
    background: url(../../svg/refresh.svg);
    background-size: cover;
}

.refresh-wp:hover {
    opacity: .7;
}

#main {
    margin-top: 40px;
}

.size-large {
    #main {
        width: 60%;

        .cmdbox {
            border: 4px solid rgba(0, 0, 0, 0.8);
            height: 80px;
        }

        .ec-itemList {
            border: 4px solid rgba(0, 0, 0, 0.8);
            border-top: 0;
        }
    }
}

.shortcuts {
    position: fixed;
    top: 25px;
    left: 31px;
    z-index: 10;
}

.clock {
    position: fixed;
    bottom: 33px;
    right: 14px;
    z-index: 10;
}
</style>

