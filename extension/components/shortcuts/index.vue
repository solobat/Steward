<template>
    <div class="shortcuts">
        <span class="shortcut-item" v-for="(item, index) in shortcuts"
            :key="index" @click="handleShortcutClick(item)">
            {{ item }}&nbsp;
        </span>
    </div>
</template>
<script>
export default {
    name: 'shortcuts',
    props: {
        shortcuts: {
            type: Array,
            default: ['bm ', 'tq ', 'site ']
        }
    },

    data() {
        return {

        };
    },

    methods: {
        handleShortcutClick(item) {
            if (item) {
                window.stewardApp.applyCommand(item);
            }
        }
    }
} 
</script>
<style lang="scss">
    .shortcuts {
        display: flex;

        .shortcut-item {
            display: block;
            position: relative;
            margin-right: 15px;
            font-size: 14px;
            color: #fff;
            font-weight: 100;
            cursor: pointer;
            opacity: 1;
            transition: all .2s;

            &:hover {
                opacity: 0.7;
            }

            &::after {
                position: absolute;
                right: -5px;
                top: 0;
                content: '|';
                transform: scale(0.7);
            }

            &:last-child {
                &::after {
                    display: none;
                }
            }
        }
    }
</style>
