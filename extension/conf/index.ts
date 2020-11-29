import { getValueByPath } from 'utils/object';

export function getAppConfig(path, defaultValue) {
  return getValueByPath(window.stewardApp.config, path, defaultValue);
}
