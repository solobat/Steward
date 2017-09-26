
var version = parseInt(navigator.userAgent.match(/Chrome\/([\d\.]+)/)[1]);

if (version < 62) {
    alert('此页面只能在Chrome >= 61版本能用!');
}
