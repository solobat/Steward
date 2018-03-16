import { backup } from '../helper'
import browser from 'webextension-polyfill'

const MAX_CACHED_CMD_NUM = 20;

export default class Appliction {
    constructor(box) {
        this.uid = Number(new Date());
        this.box = box;
        this.cachedCmds = [];
        this.viewLog = false;
        this.viewIndex = -1;

        browser.storage.local.get('cached_cmds').then(resp => {
            this.storageCmds = (resp.cached_cmds || []).slice(0, MAX_CACHED_CMD_NUM);
        });
    }

    hanldle(action) {
        switch (action.title) {
            case 'Backup':
                backup();
                break;
            default:
                break;
        }
    }

    log(input) {
        if (!this.box.isFirst && !this.viewLog) {
            this.addOne(input);
        }
    }

    addOne(input) {
        const cachedCmds = this.cachedCmds;
        const lastIndex = cachedCmds.length - 1;
        const lastOne = cachedCmds[lastIndex];

        input.sid = `${this.uid}_${this.box.sid}`;

        if (!cachedCmds.length || lastOne.sid !== input.sid) {
            cachedCmds.push(input);
        } else {
            cachedCmds[lastIndex] = input;
        }

        this.updateStorage(cachedCmds);
    }

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
    }

    applyLatestCmd() {
        this.viewLog = true;
        this.viewIndex = this.viewIndex + 1;

        browser.storage.local.get('cached_cmds').then(resp => {
            const cachedCmds = resp.cached_cmds || [];
            const item = cachedCmds[cachedCmds.length - 1 - this.viewIndex];

            if (item) {
                this.applyCmd(item.str);
                this.box.ipt[0].select();
            }
        })
    }

    resetLogView() {
        this.viewLog = false;
        this.viewIndex = -1;
    }
}