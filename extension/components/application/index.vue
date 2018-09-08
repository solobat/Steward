<template>
    <div id="main" class="main">
        <cmdbox ref="box" :mode="mode" :in-content="inContent"
            @viewHistory="viewHistory" @resetLogView="resetLogView"/>
    </div>
</template>
<script>
import cmdbox from '../cmdbox/index.vue'
import browser from 'webextension-polyfill'
import { backup } from '../../js/helper'

const MAX_CACHED_CMD_NUM = 20;

export default {
    name: 'application',
    props: {
        mode: {
            type: String,
            required: true
        },
        inContent: Boolean
    },
    data() {
        return {
            uid: Number(new Date()),
            cachedCmds: [],
            viewLog: false,
            viewIndex: -1,
            storageCmds: []
        };
    },

    components: {
        cmdbox
    },

    created() {
        browser.storage.local.get('cached_cmds').then(resp => {
            this.storageCmds = (resp.cached_cmds || []).slice(0, MAX_CACHED_CMD_NUM);
        });
        this.bindEvents();
    },

    mounted() {

    },

    methods: {
        bindEvents() {
            this.$root.$on('app:handle', action => {
                this.hanldle(action);
            });

            this.$root.$on('app:log', input => {
                this.log(input);
            });
        },

        hanldle(action) {
            switch (action.title) {
                case 'Backup':
                    backup();
                    break;
                default:
                    break;
            }
        },

        getBox() {
            return this.$refs.box;
        },

        log(input) {
            if (!this.getBox().isFirst && !this.viewLog && input.str) {
                this.addOne(input);
            }
        },

        addOne(input) {
            const cachedCmds = this.cachedCmds;
            const lastIndex = cachedCmds.length - 1;
            const lastOne = cachedCmds[lastIndex];

            input.sid = `${this.uid}_${this.getBox().sid}`;

            if (!cachedCmds.length || lastOne.sid !== input.sid) {
                cachedCmds.push(input);
            } else {
                cachedCmds[lastIndex] = input;
            }

            this.updateStorage(cachedCmds);
        },

        updateStorage(newItems) {
            browser.storage.local.get('cached_cmds').then(resp => {
                let cachedCmds = resp.cached_cmds || [];

                cachedCmds = this.storageCmds.concat(newItems);

                return cachedCmds;
            }).then(newCmds => {
                browser.storage.local.set({
                    cached_cmds: newCmds
                });
            });
        },

        viewHistory(dir, term) {
            if (dir === 'up' && (!term || this.viewLog)) {
                this.applyLatestCmd();
            } else {
                this.resetLogView();
            }
        },

        applyLatestCmd() {
            this.viewLog = true;
            this.viewIndex = this.viewIndex + 1;

            browser.storage.local.get('cached_cmds').then(resp => {
                const cachedCmds = resp.cached_cmds || [];
                const item = cachedCmds[cachedCmds.length - 1 - this.viewIndex];

                if (item) {
                    this.getBox().applyCmd(item.str);
                }
            })
        },

        resetLogView() {
            this.viewLog = false;
            this.viewIndex = -1;
        }
    }
};
</script>
<style lang="scss">

</style>
