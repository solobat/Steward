/**
 * @file login for auth callback
 * @description auth验证回调页
 * @author tomasy
 * @email solopea@gmail.com
 */

import $ from 'jquery'
import Auth from '../../js/common/auth'
import conf from '../../js/conf/pocket_conf'

console.log('hello login.js....');

var auth = new Auth(conf);

function handler(results) {
    var ret = results || {};

    return ret;
}

auth.getAccessToken(handler, function () {
    console.log('login success!....');
    window.close();
});
