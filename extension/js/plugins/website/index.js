import zhihu from './zhihu'
import util from '../../common/util'

export const websites = [zhihu];
export const websitesMap = util.array2map('host')(websites);