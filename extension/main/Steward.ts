import Axios from 'axios';
import md5 from 'blueimp-md5';
import dayjs from 'dayjs';
import $ from 'jquery';
import Toast from 'toastr';
import _ from 'underscore';
import { browser } from 'webextension-polyfill-ts';

import { StewardApp } from 'common/type';
import util from 'common/util';
import CONST from 'constant';
import PromisifyStorage from 'utils/storage';

function installGlobalSteward() {
  window.__Steward__ = window.stewardApp = getGlobalStewardAPI();
}

export function getGlobalStewardAPI() {
  return {
    chrome: window.chrome,
    browser,
    Toast,
    md5,
    axios: Axios,
    dayjs: dayjs,
    $,
    storage: PromisifyStorage,

    state: {
      background: false,
      key: '',
      stage: '',
      str: '',
      cmd: '',
      query: '',
      delay: 0,
      lastcmd: '',
      command: null,
      workflowStack: [],
      keyStatus: {
        shiftKey: false,
        ctrlKey: false,
        metaKey: false,
        altKey: false,
      },
    },

    util,
    constant: CONST,
  } as StewardApp;
}

const Steward = new Proxy<StewardApp>({} as StewardApp, {
  get(_, path) {
    if (!window.__Steward__) {
      installGlobalSteward();
    }

    return window.__Steward__[path];
  },
  set(_, path, value) {
    if (!window.__Steward__) {
      installGlobalSteward();
    }
    window.__Steward__[path] = value;

    return true
  }
});

export default Steward;
