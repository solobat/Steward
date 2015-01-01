define(function(require, exports, module) {
	console.log('hello login.js....');
	var Auth = require('./common/auth');
	var conf = require('./conf/pocket_conf');

	var auth = new Auth(conf);

	function handler(results) {
		var ret = results || {};

		return ret;
	}

	auth.getAccessToken(handler, function() {
		console.log('login success!....');
		window.close();
	});
});

seajs.use('./js/login');