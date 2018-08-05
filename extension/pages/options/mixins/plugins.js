import { plugins as pluginList } from '../../../js/plugins'
import util from '../../../js/common/util'
import CONST from '../../../js/constant'
import _ from 'underscore'

// plugins: { [pname]: { version, commands } }
const pluginModules = _.sortBy(pluginList.filter(item => item.commands), 'name').map(plugin => {
    const {name, icon, commands, title, disabled, canDisabled, authenticate} = plugin;

    const ret = {
        name,
        version: plugin.version,
        category: plugin.category,
        commands,
        title,
        icon,
        canDisabled,
        authenticate
    };

    if (canDisabled) {
        ret.disabled = disabled;
    }

    return ret;
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
        isPluginDisabled(plugin) {
            const pname = plugin.name;
            const pluginsData = this.config.plugins;

            if (pluginsData[pname] && pluginsData[pname].disabled) {
                return true;
            } else {
                return false;
            }
        },

        getDocumentURL: function(plugin) {
            return util.getDocumentURL(plugin.name, plugin.category);
        },

        handlePluginClick: function(plugin) {
            this.currentPlugin = plugin;
        },

        handlePluginAuth(plugin) {
            plugin.authenticate();
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
            }
        }
    }
}