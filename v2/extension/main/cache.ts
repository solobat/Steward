import { StewardCache } from 'common/type'

function initCache() {
  window.__StewardCache__ = {}
}

const stewardCache = new Proxy<StewardCache>({}, {
  get(_, path: keyof StewardCache) {
    if (!window.__StewardCache__) {
      initCache()
    }
    return window.__StewardCache__[path]
  },
  set(_, path, value) {
    if (!window.__StewardCache__) {
      initCache()
    }
    
    window.__StewardCache__[path] = value;

    return true;
  }
})

export default stewardCache