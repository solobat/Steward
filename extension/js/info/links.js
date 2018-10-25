/**
 * steward links
 */

const aboutLinks = {
    zh: [
        {
            title: '官网',
            desc: 'Steward 官网',
            url: 'http://oksteward.com'
        },
        {
            title: '论坛',
            desc: 'Steward 论坛: 有问题或建议可以上这里交流',
            url: 'http://bbs.oksteward.com'
        },
        {
            title: '攻略',
            desc: '看了攻略，才能更好的了解 Steward 的精髓所在',
            url: 'http://oksteward.com/steward-documents/zh/articles.html'
        },
        {
            title: '帮助文档',
            desc: '详细的 Steward 帮助文档',
            url: 'http://oksteward.com/steward-documents/zh/'
        },
        {
            title: 'QQ群',
            desc: '575397892'
        },
        {
            title: 'Telegram',
            desc: '加入 Steward Telegram 频道',
            url: 'https://t.me/chromesteward'
        },
        {
            title: '项目',
            desc: 'Steward 是 Github 上的开源项目',
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: '问题',
            desc: 'Steward 的相关问题都在这里汇总',
            url: 'https://github.com/solobat/Steward/issues'
        },
        {
            title: '开发者网站',
            desc: 'tomasy 的博客',
            url: 'http://tomasy.me'
        }
    ],
    en: [
        {
            title: 'Project Source',
            desc: 'Steward source',
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: 'Issues',
            desc: 'Steward issues',
            url: 'https://github.com/solobat/Steward/issues'
        },
        {
            title: 'Telegram',
            desc: 'Steward Telegram channel',
            url: 'https://t.me/chromesteward'
        }
    ]
};

const upLinks = {
    zh: [
        {
            title: '赞助: Steward 开发者',
            desc: '如果你觉得 Steward 还不错，确实提高了你的效率的话......',
            url: 'http://oksteward.com/donate.html'
        },
        {
            title: 'Star: Steward on Github',
            desc: 'Stars 是程序员的通行证',
            icon: chrome.extension.getURL('iconfont/github.svg'),
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: '其它作品：单词小卡片扩展',
            desc: 'tomasy 的作品，必是灵感之作 - 网页查词、例句收集、单词背诵、与Steward 结合以及导出',
            icon: chrome.extension.getURL('img/wordcard.png'),
            url: 'https://chrome.google.com/webstore/detail/oegblnjiajbfeegijlnblepdodmnddbk'
        },
        {
            title: '其它作品：单词小卡片微信小程序',
            desc: 'tomasy 的作品，必是灵感之作 - 随心制作小卡片，云端保存，分享+1，传递+1',
            icon: chrome.extension.getURL('iconfont/miniapp.svg'),
            url: 'https://minapp.com/miniapp/4333/'
        },
        {
            title: '点赞评论: 少数派文章',
            desc: '陆续会有一系列的跟 Steward 相关的文章会发布在上面',
            icon: chrome.extension.getURL('iconfont/sspai.svg'),
            url: 'https://sspai.com/user/784469/posts'
        },
        {
            title: '点赞评论: Chrome Web Store',
            desc: '让更多的人知道 Steward',
            icon: chrome.extension.getURL('iconfont/chrome.svg'),
            url: 'https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd/reviews'
        },
        {
            title: '关注: Steward 开发者微博',
            desc: '关注开发者动态，了解更多 Steward 的技巧',
            icon: chrome.extension.getURL('iconfont/weibo.svg'),
            url: 'https://weibo.com/soloooo?is_all=1'
        },
        {
            title: '关注: Steward 开发者知乎',
            desc: '关注开发者动态，了解更多 Steward 的技巧',
            icon: chrome.extension.getURL('iconfont/zhihu.svg'),
            url: 'https://www.zhihu.com/people/woodpea'
        }
    ],
    en: [
        {
            title: 'Sponsor: Steward developer',
            desc: 'If you think Steward is not bad, it does improve your efficiency......',
            url: 'https://paypal.me/tomasy/5'
        },
        {
            title: 'Star: Steward on Github',
            desc: "Stars is the programmer's pass",
            icon: chrome.extension.getURL('iconfont/github.svg'),
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: 'Like and comment: Chrome Web Store',
            desc: 'Let more people know Steward',
            icon: chrome.extension.getURL('iconfont/svg.png'),
            url: 'https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd/reviews'
        }
    ]
};

export function getAboutLinks(lang) {
    if (aboutLinks[lang]) {
        return aboutLinks[lang];
    } else {
        return aboutLinks.en;
    }
}

export function getUpLinks(lang) {
    if (upLinks[lang]) {
        return upLinks[lang];
    } else {
        return upLinks.en;
    }
}