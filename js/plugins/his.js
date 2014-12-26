define(function(require, exports, module) {
	var util = require('../common/util');

	function createItem(index, item) {
		return [
			'<div data-type="his" data-url="' + item.url + '" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
			'<span class="ec-item-name">' + item.title + '</span>',
			'</div>'
		].join('');
	}

	function searchHistory(cmdbox, key, callback) {
		chrome.history.search({
			text: key,
			maxResults: 50
		}, function(hisList) {
			if (hisList.length) {
				callback(hisList);
			}
		});
	}

	function onInput(cmdbox, key) {
		searchHistory(cmdbox, key, function(matchUrls) {
			cmdbox.showItemList(matchUrls);
		});
	}

	function onEnter(cmdbox, id) {
		window.open($(this).data('url'));	
	}


	module.exports = {
		onInput: onInput,
		onEnter: onEnter,
		createItem: createItem
	};
});