define(function(require, exports, module) {
    var pluginList = require('/js/plugins/plugins').plugins;

    let plugins = pluginList.map(plugin => {
        let {name, icon, commands, title} = plugin;

        return {
            name,
            commands,
            title,
            icon
        }
    });
    let config;

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
            if (!pluginsData[plugin.name]) {
                pluginsData[plugin.name] = {
                    commands: plugin.commands
                };
            }
        });

        render(pluginsData);
    });

    function render(pluginsData) {
        console.log(pluginsData);
        new Vue({
            el: '#app',
            data: function() {
                return {
                    version: '2.5.4',
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
                    _gaq.push(['_trackEvent', 'options_plugins', 'save']);
                }
            }
        });
    }
});
