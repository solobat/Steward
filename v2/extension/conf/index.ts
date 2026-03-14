import { getOptionsPage, getSteward } from 'common/steward';
import { getValueByPath } from 'utils/object';

export function getAppConfig(path, defaultValue) {
  return getValueByPath((getSteward() || getOptionsPage()).config, path, defaultValue);
}
