define(function(require, exports, module) {
	var util = require('../common/util');
	var url = "https://fanyi.youdao.com/openapi.do?" + "keyfrom=mineword&key=1362458147&type=data&doctype=json&version=1.1&q=";
	var emptyReg = /^\s+$/g;

	function createItem(index, item) {
		return [
			'<div data-type="yd" data-index="' + index + '" class="ec-item">',
			'<span class="ec-item-text">' + item.text + '</span>',
			'<span class="ec-item-note">' + item.note + '</span>',
			'</div>'
		];
	}

	function onInput(key) {
		if (emptyReg.test(key)) {
			return;
		}

		getTranslation(this, key);
	}

	function onEnter(id) {

	}

	function getTranslation(cmdbox, key) {
		$.get(url + key, function(data) {
			if (!data.basic) {
				return;
			}
			var retData = [];
			var phonetic = '[' + [data.basic.phonetic, data.basic['uk-phonetic'], data.basic['us-phonetic']].join(',') + ']';

			retData.push({
				text: data.translation.join(';') + phonetic,
				note: '翻译结果'
			});

			var explains = data.basic.explains.map(function(exp) {
				return {
					text: exp,
					note: '简明释义'
				};
			});

			var webs = data.web.map(function(web) {
				return {
					text: web.value.join(', '),
					note: '网络释义: ' + web.key
				};
			});

			retData = retData.concat(explains).concat(webs);

			cmdbox.showItemList(retData);
		});
	}


	module.exports = {
		onInput: onInput,
		onEnter: onEnter,
		createItem: createItem
	};
});