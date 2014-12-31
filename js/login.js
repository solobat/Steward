define(function(require, exports, module) {
    console.log('hello login.js....');
    var auth = require('./common/auth');

    auth.getAccessToken(function() {
        console.log('login success!....');
        window.close();
    });
});

seajs.use('./js/login');