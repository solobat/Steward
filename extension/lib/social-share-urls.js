// https://github.com/bradvin/social-share-urls
import browser from 'webextension-polyfill'

const Networks = [
    {
        name: 'Facebook',
        class: 'facebook',
        enable: true,
        url: 'https://www.facebook.com/sharer.php?s=100&p[url]={url}&p[images][0]={img}&p[title]={title}&p[summary]={desc}'
    },
    {
        name: 'Twitter',
        class: 'twitter',
        enable: true,
        url: 'https://twitter.com/intent/tweet?url={url}&text={title}&via={via}&hashtags={hashtags}'
    },
    {
        name: 'Google+',
        class: 'google_plus',
        enable: true,
        url: 'https://plus.google.com/share?url={url}'
    },
    {
        name: 'Pinterest',
        class: 'pinterest',
        enable: true,
        url: 'https://pinterest.com/pin/create/bookmarklet/?media={img}&url={url}&is_video={is_video}&description={title}',
    },
    {
        name: 'Linked In',
        class: 'linkedin',
        enable: true,
        url: 'https://www.linkedin.com/shareArticle?url={url}&title={title}',
    },
    {
        name: 'Buffer',
        class: 'buffer',
        enable: true,
        url: 'https://buffer.com/add?text={title}&url={url}',
    },
    {
        name: 'Digg',
        class: 'digg',
        enable: true,
        url: 'http://digg.com/submit?url={url}&title={title}',
    },
    {
        name: 'Tumblr',
        class: 'tumblr',
        enable: true,
        url: 'https://www.tumblr.com/widgets/share/tool?canonicalUrl={url}&title={title}&caption={desc}',
    },
    {
        name: 'Reddit',
        class: 'reddit',
        enable: true,
        url: 'https://reddit.com/submit?url={url}&title={title}',
    },
    {
        name: 'StumbleUpon',
        class: 'stumbleupon',
        enable: true,
        url: 'http://www.stumbleupon.com/submit?url={url}&title={title}',
    },
    {
        name: 'Delicious',
        class: 'delicious',
        enable: true,
        url: 'https://delicious.com/save?v=5&provider={provider}&noui&jump=close&url={url}&title={title}',
    },
    {
        name: 'Blogger',
        class: 'blogger',
        enable: true,
        url: 'https://www.blogger.com/blog-this.g?u={url}&n={title}&t={desc}',
    },
    {
        name: 'LiveJournal',
        class: 'livejournal',
        enable: true,
        url: 'http://www.livejournal.com/update.bml?subject={title}&event={url}',
    },
    {
        name: 'MySpace',
        class: 'myspace',
        enable: true,
        url: 'https://myspace.com/post?u={url}&t={title}&c=desc',
    },
    {
        name: 'Yahoo',
        class: 'yahoo',
        enable: true,
        url: 'http://compose.mail.yahoo.com/?body={url}',
    },
    {
        name: 'FriendFeed',
        class: 'friendfeed',
        enable: true,
        url: 'http://friendfeed.com/?url={url}',
    },
    {
        name: 'NewsVine',
        class: 'newsvine',
        enable: true,
        url: 'http://www.newsvine.com/_tools/seed&save?u={url}',
    },
    {
        name: 'EverNote',
        class: 'evernote',
        enable: true,
        url: 'http://www.evernote.com/clip.action?url={url}',
    },
    {
        name: 'GetPocket',
        class: 'getpocket',
        enable: true,
        url: 'https://getpocket.com/save?url={url}',
    },
    {
        name: 'FlipBoard',
        class: 'flipboard',
        enable: true,
        url: 'https://share.flipboard.com/bookmarklet/popout?v=2&title={title}&url={url}',
    },
    {
        name: 'InstaPaper',
        class: 'instapaper',
        enable: true,
        url: 'http://www.instapaper.com/edit?url={url}&title={title}&description={desc}',
    },
    {
        name: 'Line.me',
        class: 'line.me',
        enable: true,
        url: 'http://line.me/R/msg/text/?{url}',
    },
    {
        name: 'Skype',
        class: 'skype',
        enable: true,
        url: 'https://web.skype.com/share?url={url}',
    },
    {				
        name: 'Viber',
        class: 'viber',
        enable: true,
        url: 'viber://forward?text={url}',
    },
    {
        name: 'WhatsApp',
        class: 'whatsapp',
        enable: true,
        url: 'whatsapp://send?text={url}',
    },
    {
        name: 'Telegram.me',
        class: 'telegram_me',
        enable: true,
        url: 'https://telegram.me/share/url?url={url}&text={title}',
    },
    {
        name: 'Douban',
        class: 'douban',
        enable: true,
        url: 'http://www.douban.com/recommend/?url={url}&title={title}',
    },
    {
        name: 'Baidu',
        class: 'baidu',
        enable: true,
        url: 'http://cang.baidu.com/do/add?it={title}&iu={url}',
    },
    {
        name: 'QZone',
        class: 'qzone',
        enable: true,
        url: 'http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url={url}',
    },
    {
        name: 'Xing',
        class: 'xing',
        enable: true,
        url: 'https://www.xing.com/app/user?op=share&url={url}',
    },
    {
        name: 'RenRen',
        class: 'renren',
        enable: true,
        url: 'http://widget.renren.com/dialog/share?resourceUrl={url}&srcUrl={url}&title={title}',
    },
    {
        name: 'Weibo',
        class: 'weibo',
        enable: true,
        url: 'http://service.weibo.com/share/share.php?url={url}&appkey=&title={title}&pic={img}&ralateUid=',
    },
];

export function getNetworks() {
    return browser.storage.sync.get('socialNetworks').then(resp => {
        if (resp.socialNetworks) {
            return resp.socialNetworks;
        } else {
            return Networks;
        }
    });
}

export function saveNetworks(socialNetworks) {
    let data;

    if (socialNetworks && socialNetworks.length) {
        data = socialNetworks;
    } else {
        data = Networks;
    }

    return browser.storage.sync.set({ socialNetworks: data });
}

export function addNetworkRecord(network) {
    return getNetworks().then(list => {
        const item = list.find(item => item.name === network);

        if (item) {
            item.count = (item.count || 0) + 1;
        }

        return saveNetworks(list);
    });
}

export function generateSocialUrls(opt) {
    return getNetworks().then(list => {
        if (typeof opt !== 'object') { return false; }
        var links = [], network;
        for (var i = 0; i < list.length; i++) {
            network = list[i];

            if (network.enable) {
                links.push({
                    name : network.name,
                    class : network.class,
                    url : generateUrl(network.url, opt),
                    count: network.count || 0
                });
            }
        }

        return links.sort((a, b) => {
            return a.count > b.count ? -1 : 1;
        });
    });
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