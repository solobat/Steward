/*global _gaq*/
import { plugins as pluginList } from '../../../js/plugins/browser'
import util from '../../../js/common/util'
import CONST from '../../../js/constant'
import _ from 'underscore'

// plugins: { [pname]: { version, commands } }
const pluginModules = _.sortBy(pluginList.filter(item => item.commands), 'name').map(plugin => {
    const {name, icon, commands, title} = plugin;

    return {
        name,
        version: plugin.version,
        commands,
        title,
        icon
    }
});

export default {
    data() {
        return {
            pluginSearchText: '',
            currentPlugin: null,
            defaultPlugins: CONST.OPTIONS.DEFAULT_PLUGINS
        };
    },

    computed: {
        filteredPlugins: function() {
            const text = this.pluginSearchText.toLowerCase();

            return pluginModules.filter(plugin => {
                return plugin.name.toLowerCase().indexOf(text) > -1;
            });
        },

        hasKeywordCommands() {
            if (this.currentPlugin && this.currentPlugin.commands) {
                return this.currentPlugin.commands.filter(cmd => cmd.type === 'keyword').length > 0;
            } else {
                return false;
            }
        }
    },

    methods: {
        getDocumentURL: function(plugin) {
            return util.getDocumentURL(plugin.name);
        },

        handlePluginClick: function(plugin) {
            this.currentPlugin = plugin;
            _gaq.push(['_trackEvent', 'options_plugins', 'click', plugin.name]);
        },

        checkTriggerRepetition() {
            const curName = this.currentPlugin.name;
            const allplugins = this.config.plugins;
            const triggers = allplugins[curName].commands.map(item => item.key);
            const info = [];

            for (const name in allplugins) {
                const plugin = allplugins[name];

                if (plugin.commands && name !== curName) {
                    plugin.commands.forEach(({ key }) => {
                        if (triggers.indexOf(key) !== -1) {
                            info.push({
                                name,
                                trigger: key
                            });
                        }
                    });
                }
            }

            return info;
        },

        handlePluginsSubmit: function() {
            const checkInfo = this.checkTriggerRepetition();
            const tipsFn = ({ trigger, name }) => `「${trigger}」-- plugin 「${name}」`;

            if (checkInfo.length > 0) {
                this.$message.warning(`trigger conflict: ${checkInfo.map(tipsFn).join('; ')}`);
            } else {
                this.saveConfig();

                _gaq.push(['_trackEvent', 'options_plugins', 'save', this.currentPlugin.name]);
            }
        }
    }
}