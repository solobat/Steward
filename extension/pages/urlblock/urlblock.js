import PluginHelper from '../../js/helper/pluginHelper'

const pluginHelper = new PluginHelper();

chrome.runtime.sendMessage({
    action: 'getData'
}, resp => {
    pluginHelper.init(resp.data.blockedUrls);
})