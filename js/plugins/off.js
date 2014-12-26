define(function(require, exports, module) {
	var util = require('../common/util');

	function setEnabled(id, enabled) {
		chrome.management.setEnabled(id, enabled, function() {

		});
	}

	function getExtensions(key, enabled, callback) {
		chrome.management.getAll(function(extList) {
			var matchExts = extList.filter(function(ext) {
				return util.matchText(key, ext.name) && ext.enabled === enabled;
			});

			callback(matchExts);
		});
	}

	function onInput(cmdbox, key) {
		getExtensions(key.toLowerCase(), true, function(matchExts) {
			cmdbox.showItemList(matchExts);
		});
	}

	function onEnter(cmdbox, id) {
		setEnabled(id, false);
		cmdbox.refresh();
	}

	function createItem(index, item) {
		var url = item.icons instanceof Array ? item.icons[0].url : '';

		return [
			'<div data-type="ext" data-index="' + index + '" data-id="' + item.id + '" class="ec-item">',
			'<img class="ec-item-icon" src="' + url + '" alt="" />',
			'<span class="ec-item-name">' + item.name + '</span>',
			'</div>'
		].join('');
	}

	module.exports = {
		onInput: onInput,
		onEnter: onEnter,
		createItem: createItem
	};
});