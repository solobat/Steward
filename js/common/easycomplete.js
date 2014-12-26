define(function(require, exports, module) {
    // var $ = require('jquery');

    function EasyComplete(opt) {
        this.opt = opt;
        this.ipt = $('#' + opt.id);
        this.delay = opt.delay || 200;
        this.term = '';
        this.init();
    }

    EasyComplete.prototype = {
        searchTimer: null,
        constructor: EasyComplete,

        init: function() {
            var that = this;

            this.bindEvent();
        },

        bindEvent: function() {
            var that = this;

            // TODO: 事件处理有点不对劲
            this.ipt.bind('input', function(event) {
                var elem = this;
                var keyCode = event.keyCode;
                if (keyCode === 38 || keyCode === 40) {
                    return;
                }

                setTimeout(function() {
                    that.setTerm($(elem).val());
                    that.refresh();
                }, that.delay);
            });

            // keydown才能连续移动选中
            $(document).bind('keydown', function(event) {
                var keyCode = event.keyCode;

                // up or down
                if (keyCode === 38 || keyCode === 40) {
                    that.move(keyCode === 38 ? 'up' : 'down');
                    event.preventDefault();
                    return false;
                }

                // enter to execute the cmd
                if (keyCode === 13) {
                    that.exec();
                    return;
                }
            });

            $(document).on('click', '.ec-item', function() {
                that.selectItemByIndex($(this).data('index'));
                that.exec();
                that.refresh();
            });
        },

        setTerm: function(term) {
            this.term = term;
        },

        getTerm: function() {
            return this.term;
        },

        refresh: function() {
            // 返回数据处理，或让用户自己处理
            var dataList = this.opt.oninput(this.getTerm());

            if (dataList) {
                this.showItemList(dataList);
            }
        },

        exec: function() {
            this.opt.onEnter.call($('.ec-item-select').get(0));
        },

        move: function(direction) {
            var $itemList = $('.ec-itemList');
            var maxIndex = $('.ec-item').length - 1;
            var selectIndex = $('.ec-item-select').data('index');
            var scrollToY;

            if (direction === 'up') {
                selectIndex--;
            } else {
                selectIndex++;
            }

            if (selectIndex < 0) {
                selectIndex = maxIndex;
            } else if (selectIndex > maxIndex) {
                selectIndex = 0;
            }

            this.selectItemByIndex(selectIndex);
        },

        selectItemByIndex: function(index) {
            $('.ec-item-select').removeClass('ec-item-select');
            $('.ec-item:eq(' + index + ')').addClass('ec-item-select');

            this.refreshScrollbar();
        },

        refreshScrollbar: function() {
            var $item = $('.ec-item-select');
            var $itemList = $item.parent();

            // scroll to visible
            var pH = $itemList.height();
            var pTop = $itemList.get(0).scrollTop;

            // 选中元素与父元素顶边的距离
            var cTop = $item.get(0).getBoundingClientRect().top - $itemList.get(0).getBoundingClientRect().top;
            var cH = $item.outerHeight();

            if (cTop < 0) {
                $itemList.scrollTop(pTop + cTop);
            } else if (cTop + cH > pH) {
                $itemList.scrollTop(pTop + cTop + cH - pH);
            }
        },

        clearList: function() {
            if ($('.ec-itemList').length) {
                $('.ec-itemList').remove();
            }
        },

        showItemList: function(dataList) {
            this.clearList();

            var createItemFn = this.opt.createItem;
            var html = ['<div class="ec-itemList">'];

            for (var i = 0, len = dataList.length; i < len; i++) {
                if (createItemFn) {
                    html.push(createItemFn(i, dataList[i]));
                    continue;
                }
            }

            html.push('</div>');

            var $itemList = $(html.join(''));

            // TODO: 在此项目中不是必须的
            var iptOffset = this.ipt.offset;
            var left = iptOffset.left;
            var top = iptOffset.top + this.ipt.css('height');

            $itemList.css({
                left: left,
                top: top
            });
            $itemList.find('.ec-item').first().addClass('ec-item-select');

            $('body').append($itemList);
        }
    };

    module.exports = EasyComplete;
});