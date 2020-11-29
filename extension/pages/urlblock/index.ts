import PluginHelper from 'helper/plugin.helper'

const pluginHelper = new PluginHelper();

chrome.runtime.sendMessage({
    action: 'getData'
}, resp => {
    pluginHelper.init(resp.data.blockedUrls);
})