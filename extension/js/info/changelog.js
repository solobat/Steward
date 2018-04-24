const langZh = [
    {
        version: 'v3.4.4.1',
        detail: `
            修复 wp 命令的 Bug。
        `
    },
    {
        version: 'v3.4.4',
        detail: `
            新增 Nasa 以及 Desktoppr 壁纸来源；<br>
            pocket 重新授权及优化；<br>
            体验优化及 Bug 修复。
        `
    },
    {
        version: 'v3.4.3',
        detail: `
            支持禁用部分插件;<br>
            <em>wp</em> 命令支持上传壁纸到微博图床，壁纸来源中添加 favorites;<br>
            搜索支持批量, 页面模式搜索提升;<br>
            更多 Chrome URL 添加。
        `
    },
    {
        version: 'v3.4.2',
        detail: `
            自动添加 GitBook 类站点的 Websites 配置;<br>
            Shift + Enter 打开 Pocket 文章的原文链接;<br>
            bm / his 命令 query 为 / 时带出 host。
        `
    },
    {
        version: 'v3.4.1',
        detail: `
            存储最近的命令：输入框为空时，按向上键将显示最近20条命令记录，可以设置 -> General 面板关闭/开启；
            Ctrl + p / Ctrl + n 对应 up / down 操作。
        `
    },
    {
        version: 'v3.4',
        detail: `
            Advanced 面板添加导出、导入配置功能;<br>
            <em>Backup</em> 命令下载配置文件。 
        `
    },
    {
        version: 'v3.3.3',
        detail: `
            支持非链接导航.
        `
    },
    {
        version: 'v3.3.2',
        detail: `
            优化 Websites Navs 提取；
            修复 Websites Paths 的 bug.
        `
    },
    {
        version: 'v3.3.1',
        detail: `
            Websites 新增 outline 功能;
            Websites path 优化。 
        `
    },
    {
        version: 'v3.3',
        detail: `
            新增 website 配置面板。 
        `
    },
    {
        version: 'v3.2.9',
        detail: `
            添加随机壁纸开关选项;
            优化 pocket 插件列表显示逻辑。 
        `
    },
    {
        version: 'v3.2.8',
        detail: `
            Page 模式主题优化;<br>
            wps 命令 — 快速选择壁纸;<br>
            wfe 命令 - 快速操作 workflow 里的单条命令.
        `
    },
    {
        version: 'v3.2.7',
        detail: `
            新增主题编辑功能。<br>
            新标签页新增毛玻璃效果选项，默认关闭，使用 <em>nt </em> 命令可切换。
        `
    },
    {
        version: 'v3.2.6',
        detail: `
            修复 Bug.
        `
    },
    {
        version: 'v3.2.5',
        detail: `
            tag 不再是必需的，notes 支持搜索功能;<br>
            tab 锁定命令，trigger 为 <em>tabp</em>, 支持 Shift + Enter 与 批量操作;<br>
            增强计算器的功能;<br>
            yd 查词后添加到单词小卡片.
        `
    },
    {
        version: 'v3.2.4',
        detail: `
            新增日记插件，像聊天一样的写日记, trigger: <em>: </em>, 下载日记 trigger: <em>diary</em><br>
            更好的文案.
        `
    },
    {
        version: 'v3.2.3',
        detail: `
            wp 命令提供壁纸下载操作;<br>
            设置 new tab 标题源: <em>ntm</em> 命令;<br>
            times插件, trigger: <em>ts</em> | <em>tsd</em>;<br>
            新增「 鼠标 hover 时选中下拉项 」，默认关闭;<br>
            壁纸命令显示来源.
        `
    },
    {
        version: 'v3.2.2',
        detail: `
            壁纸源可以在「设置 -> Genenral -> 壁纸来源」 里选择;<br>
            newtab 插件，trigger 为 <em>nt</em>，用于 Steward 新标签页的一些设置;<br>
            搜索引擎应该根据使用次数排序;<br>
            搜索引擎格式优化，可以使用 <em>%s</em> 做为占位符。
        `
    },
    {
        version: 'v3.2.1',
        detail: `
            在 workflow 中可以包含别的 workflow;<br>
            workflow 优化；<br>
            help 命令支持搜索。
        `
    },
    {
        version: 'v3.2',
        detail: `
            在壁纸来源中添加 <em>picsum.photos</em>，目前已有1000来张; <br>
            新增壁纸插件, 命令 <em>trigger: wp</em>，提供刷新、保存、添加壁纸链接功能；<br>
            New Tab UI 优化及其它一些样式优化；<br>
            todo 完成后自动加入 done 列表，使用 <em>done</em> 命令查看；<br>
            off 命令允许批量操作；<br>
            修复某些命令中文汉字搜索不支持的问题。
        `
    },
    {
        version: 'v3.1.11',
        detail: `
            pocket 空查询缓存优化，以后可以加入 Random 列表了;<br>
            壁纸可自行通过链接添加;<br>
            trigger 修改时将禁止重复；<br>
            搜索引擎删除体验优化，删除后自动将引擎格式复制到剪切板。
        `
    },
    {
        version: 'v3.1.10',
        detail: `
            使用 random 命令时自动切换到 random 模式；<br> 
            修复 workflow 的 bug;<br>
            优化 New Tab 使用体验，避免误操作。
        `
    },
    {
        version: 'v3.1.9',
        detail: `
            修复 workflow 的 bug。 
        `
    },
    {
        version: 'v3.1.8',
        detail: `
            插件图标更换；<br>
            note 插件添加 notes 命令，显示所有的 note，按 Shift + Enter 时删除单条 note; <br>
            note / todo 插件 storage 使用限制提醒;<br>
            workflow 最大只能创建 20 条。
        `
    },
    {
        version: 'v3.1.7',
        detail: `
            优化 New Tab 的样式. 
        `
    },
    {
        version: 'v3.1.6',
        detail: `
            解决 New Tab 的壁纸适配问题;<br>
            更新 About 信息。 
        `
    },
    {
        version: 'v3.1.5',
        detail: `
            更友好的命令提示；<br>
            help 插件优化。
        `
    },
    {
        version: 'v3.1.4',
        detail: `
            更新文档链接;<br>
            修复背景图显示的问题;<br>
            其它一些改进. 
        `
    },
    {
        version: 'v3.1.3',
        detail: `
            命令框里打完字按 <em>ESC</em> 可以全消除;<br>
            更丰富的文档说明：使用 <em>help</em> 命令时，<em>Shift + Enter/Click</em>可以打开选中命令的<em>帮助文档<em>.
        `
    },
    {
        version: 'v3.1.2',
        detail: `
            新增random功能，在标签页随机使用通过trigger: <em>random</em>添加的命令
        `
    },
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
    }
];

const langEn = [
    {
        version: 'v3.4.4.1',
        detail: `
            fix bug of wp command.
        `
    },
    {
        version: 'v3.4.4',
        detail: `
            Added Nasa and Desktoppr wallpaper sources;<br>
            Pocket re-authorization and optimization; <br> 
            Experience optimization and bug fixes. 
        `
    },
    {
        version: 'v3.4.3',
        detail: `
            Support disabling some plugins;<br>
            Search support batch; Page mode search promotion;<br>
            More Chrome URLs added.
        `
    },
    {
        version: 'v3.4.2',
        detail: `
        Automatically add the Websites configuration of the GitBook class site;<br>
        Press Shift + Enter to open the original link of one Pocket article;<br>
        Opitimize bm / his plugins.
        `
    },
    {
        version: 'v3.4.1',
        detail: `
            Store typed query：Press the up arrow with an empty query field to view up to 20 of your last typed queries. Automatically show the latest history；
            Ctrl + p / Ctrl + n <==> up / down.
        `
    },
    {
        version: 'v3.4',
        detail: `
            Add export / import in Advanced panel;<br>
            <em>Backup</em> to download configuration.
        `
    },
    {
        version: 'v3.3.3',
        detail: `
            Support more navigation types. 
        `
    },
    {
        version: 'v3.3.2',
        detail: `
            Optimize Websites navs && fix bug of paths. 
        `
    },
    {
        version: 'v3.3.1',
        detail: `
            Add outline feature for Websites. 
        `
    },
    {
        version: 'v3.3',
        detail: `
            Add website configuration panel。 
        `
    },
    {
        version: 'v3.2.9',
        detail: `
            Add enable random wallpaper option;
            Optimize pocket list。 
        `
    },
    {
        version: 'v3.2.8',
        detail: `
            Page mode theme optimization; <br>
            wps command - Quick selection of wallpaper; <br>
            wfe command - Quick operation of a single command in the workflow. 
        `
    },
    {
        version: 'v3.2.7',
        detail: `
            Theme editing features. <br>
            Frosted glass effect for new tab.
        `
    },
    {
        version: 'v3.2.6',
        detail: `
            bugfix.
        `
    },
    {
        version: 'v3.2.5',
        detail: `
            tag is no longer required, notes supports search function; <br>
            tab lock command, trigger is <em>tabp</em>, supports Shift + Enter and bulk operations; <br>
            Enhance the function of the calculator; <br>
            yd check words added to the word small card. 
        `
    },
    {
        version: 'v3.2.4',
        detail: `
            Add diary plugin, write diary like chat, trigger: <em>: </em>, download diary trigger: <em>diary</em><br>
            Better copywriting.
        `
    },
    {
        version: 'v3.2.3',
        detail: `
            wp command to provide wallpaper download operation; <br>
            Set the new tab title source: <em>ntm</ em> command; <br>
            Add times plugin, trigger: <em>ts</ em> | <em>tsd</ em>; <br>
            New "mouse hover selected drop-down", off by default; <br>
            The wallpaper command shows the source.
        `
    },
    {
        version: 'v3.2.2',
        detail: `
            Wallpaper sources can be set in Settings -> Genenral; <br>
            newtab plugin, trigger: <em>nt</ em> , some settings for Steward's new tabs;
            Search results should be sorted according to usage; <br>
            Search engine format optimization, you can use <em>%s</em> as a placeholder.
        `
    },
    {
        version: 'v3.2.1',
        detail: `
            Workflow can include other workflow;<br>
            Optimize workflow;<br>
            Add search support for help command。
        `
    },
    {
        version: 'v3.2',
        detail: `
            Add wallpaper source from <em>picsum.photos</em>;<br>
            Add wallpaper plugin, the command's <em>trigger: wp</em>，you can save/refresh/input wallpaer link with it;<br>
            Auto add the todo which is done to the done list, use command: <em>done</em> to view;<br>
            New Tab UI optimization;<br>
            Now off command can use in bulk;<br>.
        `
    },
    {
        version: 'v3.1.11',
        detail: `
            Pocket empty query cache optimization, now you can add po to the Random list; <br>
            Wallpaper can be added by link; <br>
            Check whether the trigger is repeated;<br>
            Opitimize search engine, after delete the engine its format will be copied to the clipboard. 
        `
    },
    {
        version: 'v3.1.10',
        detail: `
            auto switch to random mode when using random command;<br>
            fix bug of workflow;<br>
            optimize new tab.
        `
    },
    {
        version: 'v3.1.9',
        detail: `
            fix bug of workflow. 
        `
    },
    {
        version: 'v3.1.8',
        detail: `
            Plugin icon replacement; <br>
            note plugin add notes command to display all the notes, 
            press SHIFT + ENTER to delete a single note; <br>
            note / todo plugin storage usage alert; <br>
            Set max workflows num to 20. 
        `
    },
    {
        version: 'v3.1.7',
        detail: `
            Optimize UI of new tab.<br>
            Document is available on <em>http://oksteward.com/steward-document-en/</em>
        `
    },
    {
        version: 'v3.1.6',
        detail: `
            Solve the New Tab wallpaper adaptation problem;<br>
            Update the About information。 
        `
    },
    {
        version: 'v3.1.5',
        detail: `
            More friendly command prompt; <br>
            help plugin optimization. 
        `
    },
    {
        version: 'v3.1.4',
        detail: `
            Update document link;<br>
            Fix the problem of the background image;<br>
            Some other improvements. 
        `
    },
    {
        version: 'v3.1.3',
        detail: `
            Command box can be completely eliminated when press the ESC ;<br>
            Richer documentation：use <em>help</em> command，press <em>Shift + Enter/Click</em> can open the <em>document<em> of one command.
        `
    },
    {
        version: 'v3.1.2',
        detail: `
        Add random feature, random use of the tab command to add the command by trigger: <em>random</ em>
        `
    },
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
    }
];

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    results = langZh;
} else {
    results = langEn;
}

export default results;