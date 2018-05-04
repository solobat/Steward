// https://github.com/bradvin/social-share-urls

const Networks = [
    {
        name: 'Facebook',
        class: 'facebook',
        url: 'https://www.facebook.com/sharer.php?s=100&p[url]={url}&p[images][0]={img}&p[title]={title}&p[summary]={desc}'
    },
    {
        name: 'Twitter',
        class: 'twitter',
        url: 'https://twitter.com/intent/tweet?url={url}&text={title}&via={via}&hashtags={hashtags}'
    },
    {
        name: 'Google+',
        class: 'google.plus',
        url: 'https://plus.google.com/share?url={url}',
    },
    {
        name: 'Pinterest',
        class: 'pinterest',
        url: 'https://pinterest.com/pin/create/bookmarklet/?media={img}&url={url}&is_video={is_video}&description={title}',
    },
    {
        name: 'Linked In',
        class: 'linkedin',
        url: 'https://www.linkedin.com/shareArticle?url={url}&title={title}',
    },
    {
        name: 'Buffer',
        class: 'buffer',
        url: 'https://buffer.com/add?text={title}&url={url}',
    },
    {
        name: 'Digg',
        class: 'digg',
        url: 'http://digg.com/submit?url={url}&title={title}',
    },
    {
        name: 'Tumblr',
        class: 'tumblr',
        url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}&caption={desc}',
    },
    {
        name: 'Reddit',
        class: 'reddit',
        url: 'https://reddit.com/submit?url={url}&title={title}',
    },
    {
        name: 'StumbleUpon',
        class: 'stumbleupon',
        url: 'http://www.stumbleupon.com/submit?url={url}&title={title}',
    },
    {
        name: 'Delicious',
        class: 'delicious',
        url: 'https://delicious.com/save?v=5&provider={provider}&noui&jump=close&url={url}&title={title}',
    },
    {
        name: 'Blogger',
        class: 'blogger',
        url: 'https://www.blogger.com/blog-this.g?u={url}&n={title}&t={desc}',
    },
    {
        name: 'LiveJournal',
        class: 'livejournal',
        url: 'http://www.livejournal.com/update.bml?subject={title}&event={url}',
    },
    {
        name: 'MySpace',
        class: 'myspace',
        url: 'https://myspace.com/post?u={url}&t={title}&c=desc',
    },
    {
        name: 'Yahoo',
        class: 'yahoo',
        url: 'http://compose.mail.yahoo.com/?body={url}',
    },
    {
        name: 'FriendFeed',
        class: 'friendfeed',
        url: 'http://friendfeed.com/?url={url}',
    },
    {
        name: 'NewsVine',
        class: 'newsvine',
        url: 'http://www.newsvine.com/_tools/seed&save?u={url}',
    },
    {
        name: 'EverNote',
        class: 'evernote',
        url: 'http://www.evernote.com/clip.action?url={url}',
    },
    {
        name: 'GetPocket',
        class: 'getpocket',
        url: 'https://getpocket.com/save?url={url}',
    },
    {
        name: 'FlipBoard',
        class: 'flipboard',
        url: 'https://share.flipboard.com/bookmarklet/popout?v=2&title={title}&url={url}',
    },
    {
        name: 'InstaPaper',
        class: 'instapaper',
        url: 'http://www.instapaper.com/edit?url={url}&title={title}&description={desc}',
    },
    {
        name: 'Line.me',
        class: 'line.me',
        url: 'http://line.me/R/msg/text/?{url}',
    },
    {
        name: 'Skype',
        class: 'skype',
        url: 'https://web.skype.com/share?url={url}',
    },
    {				
        name: 'Viber',
        class: 'viber',
        url: 'viber://forward?text={url}',
    },
    {
        name: 'WhatsApp',
        class: 'whatsapp',
        url: 'whatsapp://send?text={url}',
    },
    {
        name: 'Telegram.me',
        class: 'telegram.me',
        url: 'https://telegram.me/share/url?url={url}&text={title}',
    },
    {
        name: 'Douban',
        class: 'douban',
        url: 'http://www.douban.com/recommend/?url={url}&title={title}',
    },
    {
        name: 'Baidu',
        class: 'baidu',
        url: 'http://cang.baidu.com/do/add?it={title}&iu={url}',
    },
    {
        name: 'QZone',
        class: 'qzone',
        url: 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={url}',
    },
    {
        name: 'Xing',
        class: 'xing',
        url: 'https://www.xing.com/app/user?op=share&url={url}',
    },
    {
        name: 'RenRen',
        class: 'renren',
        url: 'http://widget.renren.com/dialog/share?resourceUrl={url}&srcUrl={url}&title={title}',
    },
    {
        name: 'Weibo',
        class: 'weibo',
        url: 'http://service.weibo.com/share/share.php?url={url}&appkey=&title={title}&pic=&ralateUid=',
    },
];

export function generateSocialUrls(opt) {
    if (typeof opt !== 'object') { return false; }
    var links = [], network;
    for (var i = 0; i < Networks.length; i++) {
        network = Networks[i];
        links.push({
            name : network.name,
            class : network.class,
            url : generateUrl(network.url, opt)
        });
    }
    return links;
}


export function generateUrl(url, opt) {
    var prop, arg, arg_ne;
    for (prop in opt) {
        arg = '{' + prop + '}';
        if  (url.indexOf(arg) !== -1) {
            url = url.replace(new RegExp(arg, 'g'), encodeURIComponent(opt[prop]));
        }
        arg_ne = '{' + prop + '-ne}';
        if  (url.indexOf(arg_ne) !== -1) {
            url = url.replace(new RegExp(arg_ne, 'g'), opt[prop]);
        }
    }
    return cleanUrl(url);
};

function cleanUrl(fullUrl) {
    //firstly, remove any expressions we may have left in the url
    fullUrl = fullUrl.replace(/\{([^{}]*)}/g, '');

    //then remove any empty parameters left in the url
    var params = fullUrl.match(/[^\=\&\?]+=[^\=\&\?]+/g),
        url = fullUrl.split("?")[0];
    if (params && params.length > 0) {
        url += "?" + params.join("&");
    }

    return url;
}