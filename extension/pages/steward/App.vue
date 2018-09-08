<template>
    <div class="container">
        <header id="header"></header>
        <application v-show="visible" mode="newTab" :in-content="false" />
        <footer></footer>
        <div class="fixed-tools">
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
import * as Core from '../../js/main/main.js'
import * as Wallpaper from '../../js/main/wallpaper.js'
import util from '../../js/common/util'
import keyboardJS from 'keyboardjs'

export default {
    name: 'App',
    data() {
        return {
            wallpaper: {
                isNew: true
            },
            visible: true
        };
    },
    components: {
        application
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

[data-page="newtab"] {
    body {
        // display: none;
    }
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
}

.action-btn {
    display: block;
    width: 20px;
    height: 20px;
    cursor: pointer;
}

.save-wplink {
    float: left;
    background: url(../../img/star.png);
    background-size: cover;

    &.saved {
        background-image: url(../../img/star-fill.png);
    }
}

.save-wplink:hover {
    background-image: url(../../img/star-fill.png);
}

.refresh-wp {
    float: right;
    background: url(../../img/refresh-white.png);
    background-size: cover;
}

.refresh-wp:hover {
    background-image: url(../../img/refresh-red.png);
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
</style>

