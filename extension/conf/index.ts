import { getSteward } from 'common/steward';
import { getValueByPath } from 'utils/object';

export function getAppConfig(path, defaultValue) {
  return getValueByPath(getSteward().config, path, defaultValue);
}
