/**
 * @file auth
 * @author tomasy
 * @email solopea@gmail.com
 */

define(function (require, exports, module) {
    function Auth(opt) {
        this.consumer_key = opt.consumer_key;
        this.requestUrl = opt.requestUrl;
        this.authenticateUrl = opt.authenticateUrl;
        this.accessTokenUrl = opt.accessTokenUrl;
        this.redirect_uri = opt.redirect_uri;
        this.appName = opt.appName;

        this.requestTokenName = this.appName + '_request_token';
        this.accessTokenName = this.appName + '_access_token';
        this.userName = this.appName + '_username';
    }

    Auth.prototype.set = function (key, value) {
        if (value) {
            localStorage[key] = value;
        }
    };

    Auth.prototype.get = function (key) {
        return localStorage[key];
    };

    Auth.prototype.isAuthenticated = function () {
        var accessToken = this.get(this.accessTokenName);

        return !!accessToken;
    };

    Auth.prototype.authenticate = function (handler) {
        var that = this;
        var data = {
            consumer_key: this.consumer_key,
            redirect_uri: window.location.href

        };

        $.post(this.requestUrl, data).done(function (results) {
            var params = handler(results);

            params.redirect_uri = that.redirect_uri;
            that.set(that.requestTokenName, params.request_token);

            chrome.tabs.create({
                'url': that.authenticateUrl + '?' + $.param(params)

            }, function (tab) {});
        });
    };

    Auth.prototype.getAccessToken = function (handler, callback) {
        var that = this;
        var data = {
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
                var params = handler(results);

                that.set(that.accessTokenName, params.access_token);
                that.set(that.userName, params.username);

                callback(results);
            },
            error: function (xhr, status, errorThrown) {
                var error = xhr.getResponseHeader('X-Error');

                if (!error || error === null) {
                    console.log('Unknown error 1 [in getAccessToken].');
                }
                else {
                    console.log(error + '[in getAccessToken].');
                }
            }

        });
    };

    module.exports = Auth;
});
