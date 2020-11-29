/**
 * @file login for auth callback
 * @description auth validation callback
 * @author tomasy
 * @email solopea@gmail.com
 */

import Auth from 'common/auth';
import conf from 'conf/pocket_conf';

console.log('hello login.js....');

const auth = new Auth(conf);

function handler(results) {
  const ret = results || {};

  return ret;
}

auth.getAccessToken(handler, function() {
  console.log('login success!....');
  window.close();
});
