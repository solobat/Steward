import 'jquery.waitforimages';

import $ from 'jquery';
import Toast from 'toastr';
import { browser } from 'webextension-polyfill-ts';

import CONST from 'constant';
import { ACTION_TYPE, saveWallpaperLink, shouldShow, WALLPAPER_ACTIONS } from 'helper/wallpaper.helper';
import { getAllSources, getSources } from 'helper/wallpaperSource.helper';
import * as api from 'service';
import * as date from 'utils/date';
import { StewardApp, StewardCache } from 'common/type';
import { StewardReadyEvent, StewardReadyEventDetail } from './type';

const $body: any = $('body');
const sourcesInfo = getAllSources();

let curUrl = '';
let state: StewardCache['wallpaper'];
let timer = 0;

function updateSaveStatus(actionType: ACTION_TYPE) {
  const conf = WALLPAPER_ACTIONS[actionType];

  saveWallpaperLink(curUrl, conf.action)
    .then(() => {
      Toast.success(conf.msg);
      let isNew: boolean;

      if (actionType === 'save') {
        window.Steward.app.emit('wallpaper:save');
        isNew = false;
      } else {
        window.Steward.app.emit('wallpaper:remove');
        isNew = true;
      }

      window.Steward.app.emit('wallpaper:refreshed', isNew);
    })
    .catch(msg => {
      Toast.warning(msg);
    });
}

export function save() {
  updateSaveStatus('save');
}

export function remove() {
  updateSaveStatus('remove');
}

export async function update(url: string, toSave: boolean, isNew: boolean) {
  if (!url) {
    return;
  }

  if (toSave) {
    window.localStorage.setItem(CONST.STORAGE.WALLPAPER, url);
  }

  curUrl = url;
  let styles: {
    [attr: string]: string
  };

  if (url.startsWith('#')) {
    styles = {
      '--app-newtab-background-image': url,
      '--newtab-background-color': url,
    };
  } else {
    styles = {
      '--app-newtab-background-image': `url(${url})`,
    };
  }

  $('html').css(styles);
  window.Steward.app.emit('wallpaper:refreshed', isNew);
  $body.waitForImages(true).done(function() {
    Toast.clear();
    state.loading = false;
    // onWallpaperChange(url);
  });
}

function recordSource(source: string) {
  window.localStorage.setItem('wallpaper_source', source);
}

export function refresh(today?: boolean, silent?: boolean) {
  const method = today ? 'today' : 'rand';
  const server = getSources(method);

  if (!silent) {
    Toast.info(chrome.i18n.getMessage('wallpaper_update'), { timeOut: 20000 });
  }

  state.loading = true;

  return Promise.all(server.tasks.map(task => task()))
    .then(sources => {
      // `result` will never be `favorites`.
      const [result, favorites] = sources;
      let type = server.name;

      if (type === 'favorites' && favorites.length === 0) {
        type = 'bing';
      }

      let wp;
      let isNew;

      if (type === 'favorites') {
        wp = sourcesInfo[type].handle(favorites);
        isNew = false;
      } else {
        wp = sourcesInfo[type].handle(result);
        isNew = favorites.indexOf(wp) === -1;
      }

      if (!/\.html$/.test(wp)) {
        shouldShow(wp)
          .then(() => {
            recordSource(type);

            return update(wp, true, isNew);
          })
          .catch(() => {
            refresh(false, true);
          });
      } else {
        state.loading = false;
        Toast.clear();
        Toast.warning('Picture error, please refresh again.');
      }
    })
    .catch(resp => {
      console.log(resp);
      state.loading = false;
      Toast.clear();
    });
}

function bindEvents() {
  document.addEventListener('stewardReady', (event: StewardReadyEvent) => {
    const Steward = event.detail.app;

    Steward.app.on('beforeleave', () => {
      console.log('beforeleave');
      clearInterval(timer);
    });
  });
}

export function init() {
  // restore
  const lastDate = new Date(
    window.localStorage.getItem(CONST.STORAGE.LASTDATE) || Number(new Date()),
  );
  const defaultWallpaper = window.localStorage.getItem(CONST.STORAGE.WALLPAPER);
  const enableRandomWallpaper =
    window.stewardCache.config.general.enableRandomWallpaper;

  state = window.stewardCache.wallpaper = {
    loading: false,
  };

  window.localStorage.setItem(CONST.STORAGE.LASTDATE, date.format());

  if (!defaultWallpaper) {
    refresh();
  } else {
    if (date.isNewDate(new Date(), lastDate) && enableRandomWallpaper) {
      refresh(true);
    } else {
      browser.storage.sync.get(CONST.STORAGE.WALLPAPERS).then(resp => {
        const list = resp[CONST.STORAGE.WALLPAPERS] || [];
        const isNew = list.indexOf(defaultWallpaper) === -1;

        update(defaultWallpaper, false, isNew);
      });
    }
  }

  api.picsum.refreshPicsumList();
  bindEvents();

  // set interval
  if (enableRandomWallpaper) {
    timer = window.setInterval(refresh, CONST.NUMBER.WALLPAPER_INTERVAL);
  } else {
    console.log('disable random');
  }
}
