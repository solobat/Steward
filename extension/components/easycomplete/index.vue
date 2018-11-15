<template>
    <div>
        <input class="cmdbox" :class="{'cmdbox-drop': dataList.length}" id="cmdbox" ref="input"
         :value="term" @input="handleInput($event)"
         autocomplete="off" type="text" spellcheck="false"
         :readonly="disabled"
         :placeholder="placeholder">
        <div id="list-wrap">
            <div class="ec-itemList" v-if="dataList.length" ref="list">
                <component v-for="(item, index) in dataList" :key="index"
                  :is="customItem" :item="item" :is-selected="selectedIndex === index"
                  @click.native="handleItemClick($event, item, index)" @mouseover.native="handleItemMouseover(item, index)">
                </component>
            </div>
        </div>
    </div>
</template>
<script>
import Vue from 'vue';
import keyboardJS from 'keyboardjs'
import CONSTANT from '../../js/constant'
import easycompleteItem from './easycompleteItem.vue'
import { dataList } from './mockData.js'
import util from '../../js/common/util.js'

Vue.component(easycompleteItem.name, easycompleteItem);

export default {
    name: 'easycomplete',
    props: {
        value: String,
        disabled: {
            type: Boolean,
            default: false
        },
        placeholder: String,
        autoResizeBoxFontSize: Boolean,
        autoSelectByMouse: Boolean,
        autoScroll: {
            type: Boolean,
            default: true
        },
        fetchSuggestions: {
            type: Function,
            default: () => {
                return dataList;
            }
        },
        delay: {
            type: Number,
            default: 200
        },
        customItem: {
            type: String,
            default: 'easycomplete-item'
        }
    },
    data() {
        return {
            term: this.$props.value || '',
            background: false,
            searchTimer: 0,
            dataList: [],
            selectedIndex: 0,
            scrollbar: {
                style: {}
            }
        };
    },

    mounted() {
        this.bindEvents();
        this.$emit('init');
    },

    watch: {
        value(newText) {
            this.render(newText);
        },
        disabled(newStatus) {
            this.handleStatusChange(newStatus);
        }
    },

    methods: {
        selectInput() {
            this.$refs.input.select();
        },

        getKeyStatusByEvent(event) {
            const { shiftKey, ctrlKey, metaKey, altKey } = event;

            return {
                shiftKey, ctrlKey, metaKey, altKey
            };
        },

        bindEvents() {
            keyboardJS.bind(['down', 'tab', 'ctrl + n'], event => {
                event.preventDefault();
                if (this.isVisible()) {
                    if (event.metaKey) {
                        window.stewardApp.notice('action:down:metakey');
                    } else {
                        this.move('down');
                        this.$emit('move', 'down');
                    }
                }
            });
            keyboardJS.bind(['up', 'shift + tab', 'ctrl + p'], (event) => {
                event.preventDefault();
                if (this.isVisible()) {
                    if (event.metaKey) {
                        window.stewardApp.notice('action:up:metakey');
                    } else {
                        this.move('up');
                        this.$emit('move', 'up');
                    }
                }
            });
            keyboardJS.bind('enter', (event) => {
                event.preventDefault();
                if (this.isVisible()) {
                    this.exec(this.dataList[this.selectedIndex], this.selectedIndex, this.getKeyStatusByEvent(event));
                }
            });
            keyboardJS.bind('esc', () => {
                this.empty();
            });
        },

        handleStatusChange(newStatus) {
            if (newStatus) {
                this.empty(true);
                this.blur();
            } else {
                this.focus();
            }
        },

        focus() {
            this.$refs.input.focus();
        },

        blur() {
            this.$refs.input.blur();
        },

        autoFocus() {
            window.addEventListener('focus', () => {
                this.$refs.input.focus();
            });
            this.$refs.input.addEventListener('blur', function() {
                this.$refs.input.focus();
            });
        },

        isVisible() {
            return true;
        },

        handleInput(event) {
            clearTimeout(this.searchTimer);

            const keyCode = event.keyCode;

            if (keyCode === CONSTANT.KEY.UP || keyCode === CONSTANT.KEY.DOWN) {
                return;
            } else {
                this.searchTimer = setTimeout(() => {
                    this.$emit('input', event.target.value);
                }, 0);
            }
        },

        render(text) {
            this.term = text;
            if (text) {
                this.refresh();

                if (this.autoResizeBoxFontSize) {
                    this.resizeUI(this.term);
                }
            } else {
                this.empty();
            }
        },

        refresh() {
            const dataList = this.fetchSuggestions(this.term);

            if (dataList) {
                if (dataList instanceof Promise || typeof dataList.then === 'function') {
                    const timer = setTimeout(() => {
                        this.showItemList(util.getLoadingResult());
                    }, 16);

                    dataList.then(resp => {
                        clearTimeout(timer);
                        if (resp.isValid) {
                            this.handleInputResult(resp.data);
                        } else {
                            console.log(`invalid promise`);
                        }
                    });
                } else {
                    this.handleInputResult(dataList);
                }
            }
        },

        handleInputResult(results) {
            if (typeof results === 'string') {
                this.render(results);
            } else if (results instanceof Array) {
                this.showItemList(results);
            }
        },

        handleItemClick(event, item, index) {
            this.select(event, item, index);
        },

        select(event, item, index) {
            this.selectItemByIndex(index);
            this.exec(item, index, this.getKeyStatusByEvent(event));
        },

        exec(item, index, keyStatus) {
            this.$emit('enter', this.dataList, index, keyStatus);
        },

        move: function (direction) {
            const maxIndex = this.dataList.length - 1;
            let selectIndex = this.selectedIndex;

            if (direction === 'up') {
                selectIndex = selectIndex - 1;
            } else {
                selectIndex = selectIndex + 1;
            }

            if (selectIndex < 0) {
                selectIndex = maxIndex;
            } else if (selectIndex > maxIndex) {
                selectIndex = 0;
            }

            this.selectItemByIndex(selectIndex);
        },

        handleItemMouseover(item, index) {
            if (this.autoSelectByMouse) {
                this.selectItemByIndex(index);
            }
        },

        selectItemByIndex(index) {
            this.selectedIndex = index;
            this.$nextTick(() => {
                if (this.dataList.length) {
                    this.refreshScrollbar();
                }
            });
        },

        refreshScrollbar() {
            const listEl = this.$refs.list;
            const itemEl = listEl.querySelector('.ec-item-select');

            if (this.dataList.length) {
                // scroll to visible
                const pH = listEl.clientHeight;
                const pTop = listEl.scrollTop;

                const cTop = itemEl.getBoundingClientRect().top - listEl.getBoundingClientRect().top;
                const cH = itemEl.clientHeight;

                if (cTop < 0) {
                    listEl.scrollTop = pTop + cTop;
                } else if (cTop + cH > pH) {
                    if (this.autoScroll) {
                        listEl.scrollTop = pTop + cTop + cH - pH + pH / 2;
                    } else {
                        listEl.scrollTop = pTop + cTop + cH - pH;
                    }
                }
            }
        },

        clearList() {
            this.dataList = [];
        },

        showItemList(dataList) {
            if (!this.background) {
                if (!dataList || !dataList.length) {
                    this.clearList();
                } else if (JSON.stringify(dataList) === JSON.stringify(this.dataList)) {
                    console.log('datalist is same...');
                } else {
                    let currentIndex = dataList.findIndex(item => item.isCurrent);

                    if (currentIndex === -1) {
                        currentIndex = 0;
                    }

                    this.dataList = dataList;
                    this.selectItemByIndex(currentIndex)
                }
            }
        },
        
        empty(silent) {
            this.$emit('input', '');
            this.clearList();

            if (!silent) {
                this.$emit('empty');
            }
        },

        resizeUI(input) {
            // TODO
        }
    }
}
</script>