/**
 * @file pocket config
 * @author tomasy
 * @email solopea@gmail.com
 */

define({
    consumer_key: '36254-48fd5cd99b53d0e9cfabbee0',
    requestUrl: 'https://getpocket.com/v3/oauth/request',
    authenticateUrl: 'https://getpocket.com/auth/authorize',
    accessTokenUrl: 'https://getpocket.com/v3/oauth/authorize',
    redirect_uri: chrome.extension.getURL('login.html'),
    appName: 'pocket'

});
