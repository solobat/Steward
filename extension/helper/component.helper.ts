/**
 * @desc pluginHelper
 */

import { Component as ComponentModel, ComponentList } from 'collection/component'
import axios from 'axios'
import dayjs from 'dayjs'
import httpVueLoader from 'http-vue-loader';
import { MIRRORS } from 'constant/options';
import { getAppConfig } from 'conf'

const componentList = new ComponentList();

function getMirror(id) {
  const conf = MIRRORS.find(item => item.id === id)

  return conf
}

export async function getComponentsConfig() {
  const config = await componentHelper.init();

  if (config && config.length) {
    return config;
  } else {
    return initComponentsConfig();
  }
}

function createComponentConfig(data, silent) {
  const { id, version, grid, args, show = false } = data
  const ret = {
    meta: data,
    id,
    args,
    version,
    grid,
    show,
    shortcuts: '',
    showByDefault: true
  }
  if (!silent) {
    componentHelper.create(ret)
  }

  return ret
}

const builtInList = [
  {
    id: 'application',
    version: '1.0.0',
    grid: [0, 2, 24, 8],
    title: "Command Box",
    subtitle: "Command Box",
    author: 'solobat',
    show: true,
    shortcuts: 'command + right',
    showByDefault: true
  }
]

async function initComponentsConfig() {
  const list = await fetchComponents();
  const initConfig = [...builtInList, ...list].map(createComponentConfig);

  return initConfig;
}

export async function getRemoteComponents() {
  const list = await fetchComponents();
  const remoteList = [...builtInList, ...list].map(item => createComponentConfig(item, true));
  const oldList = await componentHelper.init()
  const newList = []

  remoteList.forEach(newItem => {
    const oldItem = oldList.find(item => item.id === newItem.id)

    if (!oldItem) {
      newList.push(newItem)
    }
  })

  for await (const item of newList) {
    componentHelper.create(item)
  }

  return remoteList;
}

function getListURL(baseURL) {
  return `${baseURL}/data.json`
}

export function getComponentURL(path = '') {
  if (path.startsWith('http')) {
    return path
  } else {
    const mirror = getMirror(getAppConfig('general.componentsMirror', 'github'))
  
    return `${mirror.baseURL}${path}`
  }
}

function fetchComponents() {
  const mirror = getMirror(getAppConfig('general.componentsMirror', 'github'))

  return axios.get(getListURL(mirror.baseURL), {
    params: {
      t: dayjs().format('YYYYMMDD')
    }
  }).then(results => {
    return results.data.components;
  }).catch(() => {
    return [];
  })
}

export const componentHelper = {
  hasNewVersion(oldComponent, newComponent) {
    if (oldComponent.version < newComponent.version) {
      return true
    } else {
      return false
    }
  },

  updateToNewVersion(oldComponent, newComponent) {
    const { version, meta } = newComponent
    const updated = {
      ...oldComponent,
      version,
      meta
    }

    return this.update(updated)
  },
  create(info) {
    if (info.id) {
      const component = new ComponentModel();

      component.set(info);

      return Promise.resolve(componentList.chromeStorage.create(component).then(() => {
        return this.refresh().then(() => {
          return component;
        });
      }));
    } else {
      return Promise.reject('no id');
    }
  },

  update(attrs) {
    const component = componentList.set(attrs, {
      add: false,
      remove: false
    });

    return Promise.resolve(component.save().then(() => {
      return component;
    }));
  },

  save(info, forceCreate) {
    if (info.id && !forceCreate) {
      return this.update(info);
    } else {
      return this.create(info);
    }
  },

  reset() {
    componentList.models.forEach(model => componentList.chromeStorage.destroy(model))
    componentList.reset()
  },

  refresh() {
    return new Promise((resolve, reject) => {
      componentList.fetch().done(resp => {
        resolve(resp);
      }).fail(resp => {
        reject(resp);
      });
    });
  },

  getComponentList() {
    return componentList.toJSON();
  },

  init() {
    return this.refresh().then(() => {
      const list = this.getComponentList();

      return list;
    });
  }
}

declare global {
  interface Window { componentHelper: any; }
}

window.componentHelper = componentHelper

export function registerComponents(Vue, components = []) {
  components.forEach(item => {
    const { id, meta = {}, show } = item
    if (id && meta.source && show) {
      Vue.component(id, httpVueLoader(getComponentURL(meta.source)))
    }
  })
}

export function getParams(components) {
  return components.filter(item => item.show).reduce((memo, item) => {
    if (item.args) {
      memo[item.id] = item.args
    }
    return memo
  }, {});
}

export function getLayouts(components) {
  return components.filter(item => item.show).map(item => {
    const { grid = [], id: i, args = {}, showByDefault = true, shortcuts } = item;
    const [x, y, w, h] = grid;
    const { dragIgnoreFrom = 'a, input, button' } = args

    return { x, y, w, h, i, dragIgnoreFrom, show: showByDefault, shortcuts };
  });
}

export function saveLayouts(layouts) {
  layouts.forEach(item => {
    const { x, y, w, h, i } = item
    const attrs = {
      id: i,
      grid: [x, y, w, h]
    }

    componentHelper.update(attrs)
  })
}