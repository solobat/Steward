import { StewardApp } from 'common/type';
import md5 from 'blueimp-md5';
import $ from 'jquery';
import Toast from 'toastr';
import _ from 'underscore';
import { browser } from 'webextension-polyfill-ts';

import util from 'common/util';
import CONST from 'constant';

import { helpers } from '../helper';
import Axios from 'axios';
import PromisifyStorage from 'utils/storage';
import dayjs from 'dayjs';

window.Steward = window.stewardApp = {
  chrome: window.chrome,
  browser,
  Toast,
  md5,
  axios: Axios,
  dayjs: dayjs,
  $,
  storage: PromisifyStorage,

  state: {},

  helpers,
  util,
  constant: CONST,
} as StewardApp;
