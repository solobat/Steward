define(function (require, exports, module) {
    const root = 'http://www.bing.com';
    const api = require('/js/utils/api');
    const baseParams = {
        format: 'js',
        idx: 0,
        n: 1,
        mkt: 'zh-CN'
    };
    const MAX_IDX = 16;

    function getRandom(to = MAX_IDX) {
        return Math.round(Math.random() * to);
    }

    exports.today = () => {
        return api.fetch(api.url(root, '/HPImageArchive.aspx'), baseParams);
    };

    exports.rand = () => {
        return api.fetch(api.url(root, '/HPImageArchive.aspx'), Object.assign({}, baseParams, {
            idx: getRandom()
        }));
    };

    exports.root = root;
});
