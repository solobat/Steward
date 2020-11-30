import { getValueByPath } from 'utils/object';

export function getAppConfig(path, defaultValue) {
  return getValueByPath(window.Steward.config, path, defaultValue);
}
