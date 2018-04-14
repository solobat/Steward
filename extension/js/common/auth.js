import $ from 'jquery'

function Auth(opt) {
    this.consumer_key = opt.consumer_key;
    this.requestUrl = opt.requestUrl;
    this.authenticateUrl = opt.authenticateUrl;
    this.accessTokenUrl = opt.accessTokenUrl;
    this.redirect_uri = opt.redirect_uri;
    this.appName = opt.appName;

    this.requestTokenName = `${this.appName}_request_token`;
    this.accessTokenName = `${this.appName}_access_token`;
    this.userName = `${this.appName}_username`;
}

Auth.prototype.set = function (key, value) {
    if (value) {
        localStorage[key] = value;
    }
};

Auth.prototype.get = function (key) {
    return localStorage[key];
};

Auth.prototype.remove = function() {
    localStorage.removeItem(this.requestTokenName);
    localStorage.removeItem(this.accessTokenName);
    localStorage.removeItem(this.username);
};

Auth.prototype.reAuthenticate = function(handler) {
    this.remove();
    this.authenticate(handler);
};

Auth.prototype.isAuthenticated = function () {
    const accessToken = this.get(this.accessTokenName);

    return Boolean(accessToken);
};

Auth.prototype.authenticate = function (handler) {
    const that = this;
    const data = {
        consumer_key: this.consumer_key,
        redirect_uri: window.location.href
    };

    $.post(this.requestUrl, data).done(function (results) {
        const params = handler(results);

        params.redirect_uri = that.redirect_uri;
        that.set(that.requestTokenName, params.request_token);

        chrome.tabs.create({
            'url': `${that.authenticateUrl}?${$.param(params)}`

        }, function () { });
    });
};

Auth.prototype.getAccessToken = function (handler, callback) {
    const that = this;
    const data = {
        'consumer_key': this.consumer_key,
        'code': this.get(this.requestTokenName)
    };

    $.ajax({
        url: this.accessTokenUrl,
        data: JSON.stringify(data),
        headers: {
            'Content-Type': 'application/json; charset=UTF8',
            'X-Accept': 'application/json'

        },
        type: 'POST',
        dataType: 'json',
        success: function (results) {
            const params = handler(results);

            that.set(that.accessTokenName, params.access_token);
            that.set(that.userName, params.username);

            callback(results);
        },
        error: function (xhr) {
            const error = xhr.getResponseHeader('X-Error');

            if (!error || error === null) {
                console.log('Unknown error 1 [in getAccessToken].');
            } else {
                console.log(`${error}[in getAccessToken].`);
            }
        }

    });
};

export default Auth;