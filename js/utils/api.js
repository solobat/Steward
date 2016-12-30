define(function(require, exports, module) {
    let $ = window.jQuery;

    const validMethods = ['GET', 'POST'];

    function handleParams(api, data, method) {
        return Promise.resolve({
            url: api,
            method,
            data
        });
    }

    exports.url = function(root = '', path = '/') {
        return root + path;
    }

    exports.fetch = function(api, data = {}, rawMethod = 'GET') {
        return handleParams(api, data, rawMethod).then(options => {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: options.url,
                    method: options.method,
                    data: options.data
                }).done((resp) => {
                    // 兼容第三方接口
                    if (typeof resp.code === 'undefined') {
                        resolve(resp);
                    } else if (resp.code === 200) {
                        resolve(resp.data);
                    } else {
                        reject(resp);
                    }
                })
                .fail((resp) => reject(resp));
            });
        });
    }
});
