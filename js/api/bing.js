define(function (require, exports, module) {
    const root = 'https://bing.ioliu.cn/v1';
    const api = require('/js/utils/api');

    exports.today = (params = {}) => {
        return api.fetch(api.url('/'), params);
    };

    exports.rand = (params = {}) => {
        if (!params.type) {
            params.type = 'json';
        }

        return api.fetch(api.url(root, '/rand'), params);
    };
});
