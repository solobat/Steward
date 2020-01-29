<template>
    <div class="container">
        <grid-layout :layout.sync="layout" v-bind="layoutOptions" @layout-updated="onLayoutUpdated">
            <grid-item v-for="item in layout"
                    v-bind="item"
                    :key="item.i">
                <component v-if="item.i !== 'application'" v-show="item.show" :is="item.i" v-bind="componentOptions[item.i] || {}"></component>
                <transition v-else name="fade">
                    <application v-show="item.show" mode="newTab" :in-content="false" />
                </transition>
            </grid-item>
        </grid-layout>
        <div class="fixed-tools auto-hide">
            <span id="j-save-wplink" class="save-wplink action-btn" title="save wallpaper link"
                :class="[wallpaper.isNew ? 'save' : 'saved']"
                @click="handleWpSaveClick"></span>
            <span id="j-refresh-wp" class="refresh-wp action-btn" title="refresh wallpaper"
                @click="handleWpRefreshClick"></span>
        </div>
    </div>
</template>
<script>
import Vue from 'vue'
import application from '../../components/application/index.vue'
import * as Core from '../../js/main/main.js'
import * as Wallpaper from '../../js/main/wallpaper.js'
import util from '../../js/common/util'
import keyboardJS from 'keyboardjs'
import VueGridLayout from 'vue-grid-layout';
import { getParams, getLayouts, saveLayouts } from '../../js/helper/componentHelper'
import { getComponentsConfig, registerComponents } from '@/js/helper/componentHelper'

export default {
    name: 'App',
    data() {
        const general = this.$root.config.general;
        const { componentOptions, layout } = this.getComponents()

        return {
            wallpaper: {
                isNew: true
            },
            layoutOptions: {
                'col-num': 24,
                'row-height': Math.floor(window.innerHeight / 13.3),
                'is-draggable': true,
                'is-resizable': true,
                'is-mirrored': false,
                'vertical-compact': false,
                'margin': [10, 10],
                'use-css-transforms': false,
            },
            visible: true,
            widgets: general.newtabWidgets || ['wpbtns'],
            componentOptions,
            layout
        };
    },
    components: {
        application,
        GridLayout: VueGridLayout.GridLayout,
        GridItem: VueGridLayout.GridItem
    },

    created() {
        this.bindEvents();
        Wallpaper.init();
    },

    methods: {
        refreshCompoents() {
            getComponentsConfig().then(components => {
                this.$root.config.components = components
                const { componentOptions, layout } = this.getComponents()
                
                registerComponents(Vue, components)
                this.componentOptions = componentOptions
                this.layout = layout
            })
        },

        getComponents() {
            return {
                componentOptions: {
                    ...getParams(this.$root.config.components)
                },
                layout: [
                    ...getLayouts(this.$root.config.components)
                ]
            }
        },

        bindEvents() {
            chrome.storage.onChanged.addListener(changes => {
                const [key] = Object.keys(changes)

                if (key.startsWith('component')) {
                    this.refreshCompoents()
                }
            });
            this.$root.$on('wallpaper:refreshed', (isNew) => {
                this.wallpaper.isNew = isNew;
            });

            this.$root.$on('wallpaper:update', (event, url) => {
                Wallpaper.update(url, true);
            });

            this.$root.$on('apply:command', () => {
                this.visible = true;
            });

            this.layout.forEach((item, index) => {
                if (item.shortcuts) {
                    keyboardJS.bind(item.shortcuts, () => {
                        this.layout[index].show = !this.layout[index].show
                        this.$root.$emit(`comp:${item.i}`, {
                            type: 'visible',
                            value: this.layout[index].show
                        })
                    });
                }
            })
        },

        onLayoutUpdated() {
            saveLayouts(this.layout);
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

    .vue-grid-item {
        transition: none!important;

        &:hover {
            .vue-resizable-handle {
                opacity: 1;
            }
        }
    }

    .vue-resizable-handle {
        opacity: 0;
    }
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
    background: url('/iconfont/star.svg');
    background-size: cover;

    &.saved {
        background-image: url('/iconfont/star-fill.svg');
    }
}

.save-wplink:hover {
    background-image: url('/iconfont/star-fill.svg');
}

.refresh-wp {
    float: right;
    background: url('/iconfont/refresh.svg');
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

</style>

