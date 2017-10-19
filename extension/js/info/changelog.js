let langZh = [
    {
        version: 'v2.6.8',
        detail: "可以在任何页面使用steward，快捷键在<em>chrome://extensions/configureCommands</em>设置; <br />一些交互/ui优化",
        ext: 'steward'
    },
    {
        version: 'v2.6.7',
        detail: "shift + tab向上选择item，移除ctrl/alt + num选择功能(支持不好); <br />bug修复。"
    },
    {
        version: 'v2.6.6',
        detail: "在New Tab可以使用快捷键(windows: alt + right, mac: command + right)隐藏/显示命令框; <br />修复因cache导致的某些命令无法使用的bug。",
        ext: 'steward'
    },
    {
        version: 'v2.6.5',
        detail: "在下拉列表中使用<em>Tab</em>键也可以向下移动;<br/>插件/命令有序显示;<br />新增查看扩展/应用插件, keyword为<em>ext</em>"
    },
    {
        version: 'v2.6.4',
        detail: "新增newTab默认插件设置",
        ext: 'steward'
    },
    {
        version: 'v2.6.3',
        detail: "紧急bug修复"
    },
    {
        version: 'v2.6.2',
        detail: "新增打开网址功能<br /> 新增使用Google/百度/知乎/Bing/Stack Overflow搜索功能 <br />一些优化"
    },
    {
        version: 'v2.6.1',
        detail: "新增天气插件, keyword默认为<em>tq</em>"
    },
    {
        version: 'v2.6',
        detail: "性能优化及一些改进"
    },
    {
        version: 'v2.5.9',
        detail: "部分插件(<em>yd/note/calc</em>)添加复制到剪切板功能 <br />popup样式优化"
    },
    {
        version: 'v2.5.8',
        detail: "添加wallpaper下载及删除功能",
        ext: 'steward'
    },
    {
        version: 'v2.5.7',
        detail: "修复tab插件新标签页不显示icon的问题<br />新标签页左下角添加壁纸<em>保存</em>按钮，可以在设置->Appearance->Wallpapers查看/设置/取消"
    },
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

export default results;