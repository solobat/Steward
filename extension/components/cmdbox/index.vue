<template>
    <div class="cmdbox-container">
        <easycomplete ref="easycomplete"
         :autoResizeBoxFontSize="autoResizeBoxFontSize" :autoSelectByMouse="autoSelectByMouse"
         :autoScroll="autoScroll" :fetchSuggestions="queryString" v-model="text"
         @init="handleInit" @enter="handleEnter" @empty="handleEmpty"
         @move="handleMove"/>
    </div>
</template>
<script>
import easycomplete from '../easycomplete/index.vue'
import CONST from '../../js/constant'
import util from '../../js/common/util.js'
import storage from '../../js/common/storage'
import * as Core from '../../js/main/main.js'

export default {
    name: 'cmdbox',
    props: {
        mode: {
            type: String,
            required: true
        },
        inContent: Boolean
    },
    data() {
        const { autoScrollToMiddle, autoResizeBoxFontSize, autoSelectByMouse } = stewardCache.config.general;

        return {
            autohide: false,
            autoScroll: autoScrollToMiddle,
            autoResizeBoxFontSize,
            autoSelectByMouse,
            sid: 0,
            text: '',
            isFirst: false
        };
    },

    components: {
        easycomplete
    },

    created() {
        this.bindEvents();
    },

    mounted() {
        this.prepareBox();
    },

    methods: {
        bindEvents() {
            this.$root.$on('cmdbox:refresh', data => {
                if (data) {
                    this.text = data;
                } else {
                    this.$refs.easycomplete.refresh();
                } 
            });
        },

        prepareBox() {
            this.$refs.easycomplete.focus();

            // force focus in content page
            if (this.inContent) {
                this.$refs.easycomplete.autoFocus();
            }

            if (this.mode === CONST.BASE.MODE.NEWTAB &&
                window.stewardCache.config.general.autoHideCmd) {
                    this.autohide = true;
            }
        },

        applyCmd(cmd) {
            this.text = cmd;
        },

        handleInit() {
            const config = stewardCache.config;

            if (this.mode === 'newTab') {
                this.isFirst = true;
                Core.getInitCmd().then(cmd => {
                    this.applyCmd(cmd);
                });
            }
        },

        handleEnter(dataList, index, shiftKey) {
            Core.handleEnter(dataList, index, shiftKey);
        },

        handleEmpty() {
            this.sid = this.sid + 1;
            Core.handleEmpty();            
        },

        handleMove(dir) {
            if (window.stewardCache.config.general.storeTypedQuery) {
                this.$emit('viewHistory', dir, this.text);
            }
        },

        handleInput() {
            this.$emit('resetLogView');
        },

        queryString(query) {
            return Core.queryByInput(query).then(resp => {
                this.isFirst = false;
                
                return resp;
            });
        }
    }
}
</script>
<style lang="scss">
    .cmdbox {
        &.autohide {
            color: transparent;

            &:focus {
                color: #000;
            }
        }

        &.has-icon {
            background: url(../../img/icon.png) no-repeat 97% 50%;
            background-size: 40px 40px;
            padding: 0 60px 0 8px;
        }
    }
</style>
