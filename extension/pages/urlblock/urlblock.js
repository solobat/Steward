import PluginHelper from '../../js/helper/pluginHelper'
import ga from '../../js/common/ga'

const pluginHelper = new PluginHelper();

chrome.runtime.sendMessage({
    action: 'getData'
}, resp => {
    pluginHelper.init(resp.data.blockedUrls);
    ga();
})