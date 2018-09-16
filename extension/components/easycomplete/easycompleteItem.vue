<template>
    <div class="ec-item" :class="{'ec-item-select': isSelected}">
        <img class="ec-item-icon" :src="item.icon" />
        <div :class="contentClass">
            <span :class="titleClass">{{item.title}}</span>
            <span v-if="item.desc" :class="descClass">{{ item.desc }}</span>
        </div>
        <img class="ec-item-icon icon-enter" :src="enterIconUrl" />
    </div>
</template>
<script>
import { MODE } from '../../js/constant/base.js'

export default {
    name: 'easycomplete-item',
    props: {
        item: {
            type: Object,
            required: true
        },
        isSelected: Boolean,
        mode: {
            type: String,
            default: 'newTab'
        }
    },
    data() {
        return {
        };
    },

    computed: {
        enterIconUrl() {
            return this.mode === MODE.NEWTAB ? chrome.extension.getURL('iconfont/enter.svg') :
            chrome.extension.getURL('iconfont/enter-white.svg')
        },
        contentClass() {
            return {'ec-item-content': true, 'nodesc': !this.item.desc};
        },

        titleClass() {
            return {'ec-item-title': true, 'ec-item-warn': this.item.isWarn};
        },

        descClass() {
            return {'ec-item-desc': true, lazy: this.item.lazyDesc};
        }
    }
};
</script>