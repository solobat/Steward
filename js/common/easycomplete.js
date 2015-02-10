define(function (require, exports, module) {
    var util = require('./util');
    function EasyComplete(opt) {
        this.opt = opt;
        this.ipt = $('#' + opt.id);
        this.ipt.val(opt.text);
        this.delay = opt.delay || 200;
        this.term = '';
    }

    EasyComplete.prototype = {
        constructor: EasyComplete,
        o: $({}),
        searchTimer: null,

        bind: function (event, handle) {
            this.o.bind.apply(this.o, [
                event,
                $.proxy(handle, this)
            ]);
            return this;
        },

        trigger: function () {
            this.o.trigger.apply(this.o, arguments);
            return this;
        },

        init: function () {
            this.bindEvent();

            this.trigger('init');
        },

        empty: function () {
            this.ipt.val('');
            this.setTerm('');

            this.trigger('empty');
        },

        bindEvent: function () {
            var that = this;

            this.ipt.bind('input', function (event) {
                clearTimeout(this.searchTimer);

                var elem = this;
                var keyCode = event.keyCode;
                if (keyCode === 38 || keyCode === 40) {
                    return;
                }

                this.searchTimer = setTimeout(function () {
                    that.setTerm($(elem).val());
                    that.refresh();
                }, 0);
            });

            // keydown才能连续移动选中
            $(document).bind('keydown', function (event) {
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

                var keyType = util.isMac ? 'ctrlKey' : 'altKey';
                if (event[keyType] && 49 <= keyCode && keyCode <= 57) {
                    event.preventDefault();
                    event.stopPropagation();

                    that.select(keyCode - 49);

                    return;
                }
            });

            $(document).on('click', '.ec-item', function () {
                that.select($(this).data('index'));
            });
        },

        render: function (str) {
            this.ipt.val(str);
            this.setTerm(str);
            this.refresh();
        },

        select: function (index) {
            var itemNum = $('.ec-item').length;

            if (index >= 0 && index <= itemNum - 1) {
                this.selectItemByIndex(index);
                this.exec();
                this.refresh();
            }
        },

        setTerm: function (term) {
            this.term = term;
        },

        getTerm: function () {
            return this.term;
        },

        refresh: function () {
            // 返回数据处理，或让用户自己处理
            var dataList = this.opt.onInput.call(this, this.getTerm());

            if (dataList) {
                this.showItemList(dataList);
            }
        },

        exec: function () {
            this.trigger('enter', $('.ec-item-select').get(0));
        },

        move: function (direction) {
            var $itemList = $('.ec-itemList');
            var maxIndex = $('.ec-item').length - 1;
            var selectIndex = $('.ec-item-select').data('index');
            var scrollToY;

            if (direction === 'up') {
                selectIndex--;
            }
            else {
                selectIndex++;
            }

            if (selectIndex < 0) {
                selectIndex = maxIndex;
            }
            else if (selectIndex > maxIndex) {
                selectIndex = 0;
            }

            this.selectItemByIndex(selectIndex);
        },

        selectItemByIndex: function (index) {
            $('.ec-item-select').removeClass('ec-item-select');
            $('.ec-item:eq(' + index + ')').addClass('ec-item-select');

            this.refreshScrollbar();
        },

        refreshScrollbar: function () {
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
            }
            else if (cTop + cH > pH) {
                $itemList.scrollTop(pTop + cTop + cH - pH);
            }
        },

        clearList: function () {
            if ($('.ec-itemList').length) {
                $('.ec-itemList').remove();
            }
            this.trigger('clear');
        },

        showItemList: function (dataList, fn) {
            this.clearList();
            if (!dataList || !dataList.length) {
                return;
            }

            // TODO: 没有此需求的时候怎么办呢
            var createItemFn = fn || this.opt.createItem;
            var html = [
                '<div class="ec-itemList">'
            ];

            for (var i = 0, len = dataList.length; i < len; i++) {
                if (createItemFn) {
                    html.push(createItemFn.call(this, i, dataList[i]));
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
            this.trigger('show');
        }

    };

    module.exports = EasyComplete;
});
