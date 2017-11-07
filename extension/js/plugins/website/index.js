import zhihu from './zhihu'
import github from './github'
import util from '../../common/util'

export const websites = [zhihu, github];
export const websitesMap = util.array2map('host')(websites);