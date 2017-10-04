import $ from 'jquery'

const validMethods = ['GET', 'POST'];

function handleParams(api, data, method) {
    return Promise.resolve({
        url: api,
        method,
        data
    });
}

export function url(root = '', path = '/') {
    return root + path;
}

export function fetch(api, data = {}, rawMethod = 'GET') {
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