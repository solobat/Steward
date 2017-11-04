/**
 * about
 */

const extType = EXT_TYPE === 'alfred' ? 'Browser Alfred' : 'steward';
const storeId = extType === 'steward' ? 'dnkhdiodfglfckibnfcjbgddcgjgkacd' : 'jglmompgeddkbcdamdknmebaimldkkbl';

let langZh = `
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>
最早开发于<span class="notice">2014</span>年底，初衷是作为一个Chrome扩展爱好者，居然找不到一个方便管理它们的方式。于是花了一个晚上写了${extType}的第一版。
虽然没怎么推广，用户也不是很多，但一有空闲就会维护，毕竟${extType}几乎已经成为我使用频率最高的扩展了。<br>
<br>
如果觉得它还不错，希望可以给我<a href="https://chrome.google.com/webstore/detail/${storeId}/reviews?hl=zh-CN'">点赞评论</a>或通过下方的二维码 <span class="notice">请我喝杯咖啡</span>，这是对${extType}的最大鼓励。
虽然一直在安静地开发，但也希望通过大家的口口相传，让更多的人知道
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>的存在。
<img src="http://owsjc7iz3.bkt.clouddn.com/IMG_2180.jpg" alt="" class="wx-pay">
`;

let langEn = `
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a> 
was first developed at the end of <span class="notice">2014</span>. 
The original intention is as a Chrome extension enthusiasts, I actually can not find a convenient way to manage them。
Then I spent one night to develop the first version of ${extType}。
Although without much promotion, and the user is not a lot, but I would develop it as soon as I can.
After all, ${extType} has almost become the most frequently used extension for me.<br>
<br>
If you think it is not bad, I hope you can give me some <a href="https://chrome.google.com/webstore/detail/${storeId}/reviews'">praise</a>，this is the biggest encouragement for ${extType}。
Although I have been quietly developing, but also hope that through everyone's word of mouth, so that more people know 
<a href="https://chrome.google.com/webstore/detail/${storeId}">${extType}</a>。
`;

let results;

if (chrome.i18n.getUILanguage().indexOf('zh') > -1) {
    results = langZh;
} else {
    results = langEn;
}

export const aboutus = results;