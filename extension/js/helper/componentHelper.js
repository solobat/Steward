/**
 * @desc pluginHelper
 */

import { Component as ComponentModel, ComponentList } from '../collection/component'
import axios from 'axios'
import dayjs from 'dayjs'
import httpVueLoader from 'http-vue-loader';

const componentList = new ComponentList();

export async function getComponentsConfig() {
  const config = await componentHelper.init();

  if (config && config.length) {
    return config;
  } else {
    return initComponentsConfig();
  }
}

function createComponentConfig(data, silent) {
  const { id, version, grid, show = false } = data
  const ret = {
    meta: data,
    id,
    version,
    grid,
    show
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
    author: 'tomasy',
    show: true
  }
]

async function initComponentsConfig() {
  const list = await fetchComponents();
  const initConfig = [...builtInList, ...list].map(createComponentConfig);

  return initConfig;
}

export async function getRemoteComponents() {
  const list = await fetchComponents();
  const config = [...builtInList, ...list].map(item => createComponentConfig(item, true));

  return config;
}

const LIST_URL = 'https://raw.githubusercontent.com/Steward-launcher/steward-newtab-components/master/data.json';

function fetchComponents() {
  return axios.get(LIST_URL, {
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

  save(info) {
    if (info.id) {
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

window.componentHelper = componentHelper

export function registerComponents(Vue, components = []) {
  components.forEach(item => {
    const { id, meta = {}, show } = item
    if (id && meta.source && show) {
      Vue.component(id, httpVueLoader(meta.source))
    }
  })
}

export function getLayouts(components) {
  return components.filter(item => item.show).map(item => {
    const { grid = [], id: i } = item;
    const [x, y, w, h] = grid;

    return { x, y, w, h, i };
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