define(function(require, exports, module) {
    // TODO: use conf
    var CONSUMER_KEY = '36254-48fd5cd99b53d0e9cfabbee0';
    var url = {
        authenticate: 'https://getpocket.com/v3/oauth/request',
    };

    function isAuthenticated() {
        return localStorage['access_token'] && localStorage['access_token'] != null;
    }

    function authenticate() {
        var redirect_uri = window.location.href;
        var data = {
            consumer_key: CONSUMER_KEY,
            redirect_uri: redirect_uri
        };

        $.post(url.authenticate, data).done(function(data) {
            var code = data.split('=')[1];
            var request_token = localStorage['request_token'] = code;

            var redirect_uri = chrome.extension.getURL('login.html');

            chrome.tabs.create({
                'url': 'https://getpocket.com/auth/authorize?request_token=' +
                    encodeURIComponent(request_token) + '&redirect_uri=' + encodeURIComponent(redirect_uri)
            }, function(tab) {

            });
        });
    }

    function getAccessToken(callback) {
        var url = 'https://getpocket.com/v3/oauth/authorize';
        var data = {
            "consumer_key": CONSUMER_KEY,
            "code": localStorage['request_token']
        };

        // WHY: cannot use post
        $.ajax({
            url: url,
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json; charset=UTF8',
                'X-Accept': 'application/json'
            },
            type: "POST",
            dataType: "json",
            success: function(data) {
                localStorage['access_token'] = data.access_token;
                localStorage['username'] = data.username;
                callback();
            },
            error: function(xhr, status, errorThrown) {
                var error = xhr.getResponseHeader('X-Error');

                if (!error || error === null) {
                    console.log('Unknown error 1 [in getAccessToken].');
                } else {
                    console.log(error + '[in getAccessToken].');
                }
            },

            // code to run regardless of success or failure
            complete: function(xhr, status) {}
        });
    }

    module.exports = {
        CONSUMER_KEY: CONSUMER_KEY,
        isAuthenticated: isAuthenticated,
        authenticate: authenticate,
        getAccessToken: getAccessToken
    };
});