/**
 * about
 */

const langZh = `
<a href="http://oksteward.com/steward-documents/zh/" target="_blank">帮助文档</a>
<a href="http://bbs.oksteward.com" target="_blank" style="margin-left: 12px;">论坛</a>
<a href="https://t.me/chromesteward" target="_blank" style="margin-left: 12px;">Telegram</a>
<br>
<span>QQ群: 575397892</span>
<hr>
<iframe v-if="activeName === 'help'" height="330" width="510" src='http://player.youku.com/embed/XMzEyNDE4MDUzMg==' frameborder="0" allowfullscreen></iframe> <br>
<img src="http://static.oksteward.com/qrcode_wx_gzh.jpg" alt="微信公众号" class="qrcode">
`;

const langEn = `
<a href="http://oksteward.com/steward-document-en/" target="_blank">Document</a><br>
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