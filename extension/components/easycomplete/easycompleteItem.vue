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
        const item = this.$props.item;
        const mode = this.$props.mode;
        const contentClass = {'ec-item-content': true, 'nodesc': !item.desc};
        const titleClass = {'ec-item-title': true, 'ec-item-warn': item.isWarn};
        const enterIconUrl = mode === MODE.NEWTAB ? chrome.extension.getURL('img/enter.png') :
            chrome.extension.getURL('img/enter-white.png');
        const descClass = {'ec-item-desc': true, lazy: item.lazyDesc};

        return {
            contentClass,
            titleClass,
            enterIconUrl,
            descClass
        };
    }
};
</script>