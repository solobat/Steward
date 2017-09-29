define(function(require, exports, module) {
    let langZh = [
        {
            version: 'v2.5.6',
            detail: "新增缓存上一条命令选项。<br />修复<em>calc</em>的bug。<br />版本更新后自动切换到update面板。<br />修复bk8不能unblock的问题。"
        },
        {
            version: 'v2.5.5',
            detail: "URL Block插件新增<em>bk8</em>命令以替代原来的<em>bk</em>，后者不再有时间限制<br>插件添加版本管理，从v1开始计数"
        },
        {
            version: 'v2.5.4',
            detail: "添加帮助文档/更新日志/相关"
        },
        {
            version: 'v2.5.3',
            detail: "紧急修复Bug"
        },
        {
            version: 'v2.5.2',
            detail: "添加topsites插件，使用<em>site</em>关键字，查找你的最常访问网站"
        },
        {
            version: 'v2.5',
            detail: "添加插件管理页，可更改各插件的<em>keyword</em>"
        }
    ];

    // TODO: translate
    let langEn = [

    ];

    let results;

    if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
        results = langZh;
    } else {
        results = langEn;
    }

    module.exports = results;
});
