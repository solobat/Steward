define(function(require, exports, module) {
    var pluginList = [
        require('/js/plugins/jenkins'),
        require('/js/plugins/note'),
        require('/js/plugins/tab'),
        require('/js/plugins/on'),
        require('/js/plugins/off'),
        require('/js/plugins/set'),
        require('/js/plugins/del'),
        require('/js/plugins/run'),
        require('/js/plugins/his'),
        require('/js/plugins/bookmark'),
        require('/js/plugins/yd'),
        require('/js/plugins/todo'),
        require('/js/plugins/pocket'),
        require('/js/plugins/calculate'),
        require('/js/plugins/urlblock'),
        require('/js/plugins/download'),
        require('/js/plugins/help')
    ]

    module.exports = {
        plugins: pluginList
    }
})
