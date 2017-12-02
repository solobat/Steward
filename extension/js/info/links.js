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
            title: '知识星球 - Steward 之家',
            desc: '让 Steward 在大家的帮助下不断成长',
            url: 'https://t.xiaomiquan.com/zFAyniY'
        },
        {
            title: '帮助文档',
            desc: '详细的 Steward 帮助文档',
            url: 'http://oksteward.com/steward-document-zh/'
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
            title: '交流',
            desc: '加入 Steward Telegram 频道',
            url: 'https://t.me/chromesteward'
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
            title: '知识星球 - Steward 之家',
            desc: '让 Steward 在大家的帮助下不断成长',
            url: 'https://t.xiaomiquan.com/zFAyniY'
        },
        {
            title: '赞助: Steward 开发者',
            desc: '如果你觉得 Steward 还不错，确实提高了你的效率的话......',
            url: 'http://oksteward.com'
        },
        {
            title: 'Star: Steward on Github',
            desc: 'Stars 是程序员的通行证',
            icon: chrome.extension.getURL('img/github.png'),
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: '点赞评论: 少数派文章',
            desc: '陆续会有一系列的跟 Steward 相关的文章会发布在上面',
            icon: chrome.extension.getURL('img/sspai.png'),
            url: 'https://sspai.com/user/784469/posts'
        },
        {
            title: '点赞评论: Chrome Web Store',
            desc: '让更多的人知道 Steward',
            icon: chrome.extension.getURL('img/chrome.png'),
            url: 'https://chrome.google.com/webstore/detail/dnkhdiodfglfckibnfcjbgddcgjgkacd/reviews'
        },
        {
            title: '关注: Steward 开发者微博',
            desc: '关注开发者动态，了解更多 Steward 的技巧',
            icon: chrome.extension.getURL('img/weibo.png'),
            url: 'https://weibo.com/soloooo?is_all=1'
        },
        {
            title: '关注: Steward 开发者知乎',
            desc: '关注开发者动态，了解更多 Steward 的技巧',
            icon: chrome.extension.getURL('img/zhihu.png'),
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
            icon: chrome.extension.getURL('img/github.png'),
            url: 'https://github.com/solobat/Steward'
        },
        {
            title: 'Like and comment: Chrome Web Store',
            desc: 'Let more people know Steward',
            icon: chrome.extension.getURL('img/chrome.png'),
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