/*global EXT_TYPE */
const wordcardUrl = 'https://chrome.google.com/webstore/detail/oegblnjiajbfeegijlnblepdodmnddbk';
const langZh = [
    {
        version: 'v3.1.1',
        detail: `
            新增workflow的删除功能;<br>
            调整todo的功能; <br>
            新增<em>tabm</em>命令，用来移动选中的标签；<br>
            搜索引擎可以自定义<a href="https://github.com/solobat/Steward/issues/11" target="_blank">#11</a>;<br>
        `
    },
    {
        version: 'v3.1',
        detail: `
            新增<a href="https://github.com/solobat/Steward/wiki/workflow" target="_blank">workflow</a>面板，创建、编辑workflow，以及新增执行workflow的插件，trigger为<em>wf</em>;<br>
            新增<a href="https://github.com/solobat/Steward/wiki" target="_blank">帮助文档</a>
            <a href="http://v.youku.com/v_show/id_XMzE4MTQ5NzEyMA==.html?spm=a2h3j.8428770.3416059.1" target="_blank">更新视频</a>
        `
    },
    {
        version: 'v3.0.2',
        detail: `
            新增<em>tabc</em>命令，关闭一个或多个匹配的tab;<br>
            bm/site/his命令，新增<em>shift</em> keypress，可以同时打开一组tab;<br> 
            ext命令的shift keypress打开扩展的homepage.
            <a href="http://v.youku.com/v_show/id_XMzE3NzQ5NjEzMg==.html?spm=a2h3j.8428770.3416059.1" target="_blank">更新视频</a>
        `
    },
    {
        version: 'v3.0.1',
        detail: `
            修复因urlblock导致的crash问题(todo改变标签标题的功能暂时去掉);<br>
            新增new Tab输入框失去焦点时字体透明不显示的设置项;<br>
            优化单词小卡片扩展插件；<br>
        `
    },
    {
        version: 'v3.0',
        detail: `
            新增恢复初始化设置;<br>
            可设置newTab滚动到底部后自动往上到中间位置;<br>
            书签删除命令 - branch: bmd;<br>
            custom插件，自定义输入框中的默认命令;<br>
            unblock后恢复页面;<br>
            remove todo后恢复title;<br>
            壁纸从bing或收藏里随机选取，并自动隐藏save按钮;<br>
            性能优化.<br>
            <a href="http://v.youku.com/v_show/id_XMzE3MTExMDMyMA==.html?spm=a2h3j.8428770.3416059.1" target="_blank">更新视频</a>
        `
    },
    {
        version: 'v2.9.1',
        detail: `
            NewTab命令除选择外还可以自定义;
            <br><a href="${wordcardUrl}" target="_blank">单词小卡片</a>插件新增更多level icon，对应level等级;
            <br>note命令在页面使用时打上当前页面的标签.
            <br><a href="http://v.youku.com/v_show/id_XMzE2NzIyNTE2OA==.html?spm=a2h3j.8428770.3416059.1" target="_blank">更新视频</a>
        `
    },
    {
        version: 'v2.9',
        detail: `
            新增扩展类插件架构，使用命令与其它扩展交互
            (目前提供<a href="${wordcardUrl}" target="_blank">单词小卡片扩展</a>, trigger为<em>wd</em>);<br>
            其它一些优化。
            <br><a href="http://v.youku.com/v_show/id_XMzE2NDA4MzY1Ng==.html?spm=a2h3j.8428770.3416059.1" target="_blank">更新视频</a>
        `
    },
    {
        version: 'v2.8.7',
        detail: 'i18n update'
    },
    {
        version: 'v2.8.6',
        detail: '在页面内使用时urlblock时，输入 / 自动带出当前域名; <br/>页面内使用优化.'
    },
    {
        version: 'v2.8.5',
        detail: '优化页面内使用的体验;<br /> 添加github website插件; <br />其它一些优化。'
    },
    {
        version: 'v2.8.4',
        detail: '在页面中使用 <em>/</em> 来列出所有website选项; <br/>更多的国际化支持; <br />一些小优化。'
    },
    {
        version: 'v2.8.3',
        detail: '新增页面插件架构，通过在网站内启动扩展使用，主要提供不同网站内导航等功能，目前提供知乎插件，具体请看帮助选项里的视频；<br />样式优化。'
    },
    {
        version: 'v2.8.2',
        detail: "bug修复以及一些小修改。"
    },
    {
        version: 'v2.8.1',
        detail: "加入设置steward设置选项搜索；<br />bug修复。"
    },
    {
        version: 'v2.8',
        detail: "加入chrome-urls搜索；<br />一些改进"
    },
    {
        version: 'v2.7',
        detail: `可以在任何页面使用${EXT_TYPE}，快捷键在<em>chrome://extensions/configureCommands</em>设置; <br />一些交互/ui优化`
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

const langEn = [
    {
        version: 'v3.1.1',
        detail: `
            Add workflow delete button;<br>
            Update todo plugin; <br>
            Added <em>tabm</em> command to move the selected tab；<br>
            Search engines can be customized<a href="https://github.com/solobat/Steward/issues/11" target="_blank">#11</a>;<br>
        `
    },
    {
        version: 'v3.1',
        detail: `
        Add <a href="https://github.com/solobat/Steward/wiki/workflow" target="_blank">workflow</a> panel，to create or edit workflow, as well as add a workflow plugin, the trigger is: <em>wf</em>;<br>
        <a href="https://youtu.be/gAOPgCoHb8U" target="_blank">Video</a> 
        `
    },
    {
        version: 'v3.0.2',
        detail: `
            Added <em>tabc</em> command to close one or more matching tabs; <br>
            bm / site / his command, can open a group of tab with <em>shift</em> keypress; <br>
            ext command with Shift keypress  to open the extended homepage. 
            <a href="https://www.youtube.com/watch?v=9k6xxDQJBOY&feature=youtu.be" target="_blank">video</a>
        `
    },
    {
        version: 'v3.0.1',
        detail: `
            Fix for crash caused by urlblock (todo change tag caption temporarily removed);<br>
            Some other optimization.
        `
    },
    {
        version: 'v3.0',
        detail: `
            Added restore initialization settings; <br>
            Can set newTab scroll to the bottom automatically to the middle position; <br>
            Bookmark delete command - trigger: bmd; <br>
            Add custom plugin, which can custom default command of the newTab input box; <br>
            Unblock url and then restore the page; <br>
            Remove todo then restore the title; <br>
            Random wallpaper from bing or collection, and automatically hide the save button; <br>
            Performance optimization. <br>
            <a href="https://youtu.be/aoMtCPvlvCM" target="_blank">video</a>
        `
    },
    {
        version: 'v2.9.1',
        detail: `
            The NewTab command can be customized in addition to the options;
            <br>The note command automatically add tag of the host when used in page.
            <br><a href="https://youtu.be/_MDInm7q360" target="_blank">video</a>
        `
    },
    {
        version: 'v2.9',
        detail: 'Optimize'
    },
    {
        version: 'v2.8.7',
        detail: 'i18n update'
    },
    {
        version: 'v2.8.6',
        detail: 'When using urlblock within a page, enter / automatically bring out the current domain name; <br />Optimize the experience within the page.'
    },
    {
        version: 'v2.8.5',
        detail: 'Optimize the experience used within the page; <br />Add github plugin.'
    },
    {
        version: 'v2.8.4',
        detail: 'Some optimization'
    },
    {
        version: 'v2.8.3',
        detail: 'New page plug-in architecture, through starting the extension in page to use, mainly to provide navigation and other functions within the website, currently available in zhihu.com, specifically please see the video in the help options；<br />Style optimization。'
    }
];

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    results = langZh;
} else {
    results = langEn;
}

export default results;