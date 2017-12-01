/**
 * about
 */
/*global EXT_TYPE*/

const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';

const langZh = `
<a href="http://oksteward.com/steward-document-zh/" target="_blank">帮助文档</a><br>
<hr>
<iframe v-if="activeName === 'help'" height="330" width="510" src='http://player.youku.com/embed/XMzEyNDE4MDUzMg==' frameborder="0" allowfullscreen></iframe> <br>
请尝试更新至最新版的浏览器，以免有些功能用不了。<br>
如果你在使用过程中有什么建议或疑问，可以去<a href="https://github.com/solobat/Steward/issues" target="_blank">这里</a>; <br>
同时你也可以加入<a href="https://t.me/chromesteward" target="_blank">Telegram</a>频道, 或者扫描下方二维码添加微信公众号，获取${extType}的第一手资料
<img src="http://owsjc7iz3.bkt.clouddn.com/qrcode_wx_gzh.jpg" alt="微信公众号" class="qrcode">
`;

const langEn = `
<a href="http://oksteward.com/steward-document-zh/" target="_blank">Document</a><br>
<iframe v-if="activeName === 'help'" width="560" height="315" src="https://www.youtube.com/embed/7-SpiiidDzU" frameborder="0" allowfullscreen></iframe>
<br>
Please try to upgrade the latest version of the browser, to avoid some of the features can not be used.<br>
If you have any suggestions / problems in the process of using it, you can go <a href="https://github.com/solobat/Steward/issues">Here</a>，or join the <a href="https://t.me/chromesteward" target="_blank">Telegram</a> channel。
`;

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    results = langZh;
} else {
    results = langEn;
}

export const helpInfo = results;