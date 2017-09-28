define(function(require, exports, module) {
    var pluginList = require('/js/plugins/plugins').plugins;

    let plugins = pluginList.map(plugin => {
        let {name, icon, commands, title, version} = plugin;

        return {
            name,
            version,
            commands,
            title,
            icon
        }
    });
    let config;

    /*
        pluginsData: {
            [pname]: {
                version,
                commands
            }
        }
     */
    chrome.storage.sync.get('config', function(res) {
        if (res.config) {
            config = res.config;
        } else {
            config = {};
        }

        let pluginsData = {};

        if (config.plugins) {
            pluginsData = config.plugins;
        }

        // 总是确保数据是最新的
        plugins.forEach(plugin => {
            mergePluginData(plugin, pluginsData);
        });

        render(pluginsData);
    });

    function mergePluginData(plugin, pluginsData) {
        let pname = plugin.name;
        let cachePlugin = pluginsData[pname];
        let version = plugin.version;

        if (!cachePlugin) {
            pluginsData[pname] = {
                version,
                commands: plugin.commands
            };
        } else {
            if (!cachePlugin.version) {
                cachePlugin.version = 1;
            }

            if (version > cachePlugin.version) {
                // rough merge
                cachePlugin.commands = $.extend(true, plugin.commands, cachePlugin.commands);
                cachePlugin.version = version;
            }
        }
    }

    function render(pluginsData) {
        new Vue({
            el: '#app',
            data: function() {
                return {
                    version: '2.5.5',
                    activeName: 'plugins',
                    pluginSearchText: '',
                    currentPlugin: null,
                    pluginsData
                }
            },
            computed: {
                plugins: function() {
                    let text = this.pluginSearchText.toLowerCase();

                    return plugins.filter(plugin => {
                        return plugin.name.toLowerCase().indexOf(text) > -1;
                    });
                }
            },
            methods: {
                handleClick: function(tab) {
                    _gaq.push(['_trackEvent', 'options_tab', 'click', tab.name]);
                },

                handlePluginClick: function(plugin) {
                    this.currentPlugin = plugin;
                    _gaq.push(['_trackEvent', 'options_plugins', 'click', plugin.name]);
                },

                handlePluginsSubmit: function() {
                    let formData = JSON.parse(JSON.stringify(this.pluginsData));
                    const self = this;

                    chrome.storage.sync.set({
                        config: {
                            plugins: formData
                        }
                    }, function() {
                        self.$message('保存成功!');
                    });
                    _gaq.push(['_trackEvent', 'options_plugins', 'save', this.currentPlugin.name]);
                }
            }
        });
    }
});
