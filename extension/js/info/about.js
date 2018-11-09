/**
 * about
 */
/*global EXT_TYPE*/

import stat from './stat'

const extType = EXT_TYPE === 'stewardlite' ? 'Steward Lite' : 'Steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';
const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const langZh = `
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>
最早开发于 2014 年底，初衷是作为一个 Chrome 扩展爱好者，居然找不到一个方便管理它们的方式。于是花了一个晚上写了 ${extType} 的第一版，而 Steward 能以现在的面貌跟大家见面，不止是开发者 <em>三年</em> 以来空闲时间的开发积累，更是 2017 年辞职两个月专注开发的成果。<br>
<br>
如果觉得它还不错，希望可以给我<a href="https://chrome.google.com/webstore/detail/${storeId}/reviews?hl=zh-CN'">点赞评论</a>、
<a href="https://github.com/solobat/Steward" target="_blank">star</a><em>[${stat[version].star}]</em>
或通过下方的二维码 <span class="notice">请我喝杯咖啡</span>，这是对${extType}的最大鼓励。
虽然一直在安静地开发，但也希望通过大家的口口相传，让更多的人知道
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>的存在。
<div class="qrcodes">
    <div>
        <h3>微信</h3>
        <img src="http://static.oksteward.com/IMG_2180.jpg" alt="" class="wx-pay qrcode">
    </div>
    <div>
        <h3>支付宝</h3>
        <img src="http://static.oksteward.com/alipay3.jpg" alt="" class="ali-pay qrcode">
    </div>
</div>
`;

const langEn = `
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a> 
was first developed at the end of 2014. 
The original intention is as a Chrome extension enthusiasts, I actually can not find a convenient way to manage them。
Then I spent one night to develop the first version of ${extType}。
Although without much promotion, and the user is not a lot, but I would develop<em>[?]</em> it as soon as I can.
After all, ${extType} has almost become the most frequently used extension for me.<br>
<br>
If you think it is not bad, I hope you can give me some 
<a href="https://chrome.google.com/webstore/detail/${storeId}/reviews'">praise</a>
 or <a href="https://github.com/solobat/Steward" target="_blank">star</a><em>[${stat[version].star}]</em>，
and you can ask me for a cup of coffee through the link below.
This is the biggest encouragement for ${extType}。
Although I have been quietly developing, but also hope that through everyone's word of mouth, so that more people know 
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>。
<br><br>
<div>
<h3>PayPal:</h3> Please click <a href="https://paypal.me/tomasy/5" target="_blank">Payment Link</a>
</div>
`;

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    results = langZh;
} else {
    results = langEn;
}

export const aboutus = results;