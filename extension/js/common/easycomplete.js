import $ from 'jquery'
import KEY from '../constant/keycode'
import keyboardJS from 'keyboardjs'

function EasyComplete(opt) {
    this.opt = opt;
    this.ipt = $(`#${opt.id}`);
    this.ipt.val(opt.text);
    this.delay = opt.delay || 200;
    this.term = '';
}

EasyComplete.prototype = {
    constructor: EasyComplete,
    o: $({}),
    searchTimer: null,

    bind: function (event, handle) {
        Reflect.apply(this.o.bind, this.o, [event, $.proxy(handle, this)]);
        return this;
    },

    trigger: function (...args) {
        Reflect.apply(this.o.trigger, this.o, args);
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

    isVisible: function() {
        return this.ipt.is(':visible');
    },

    bindEvent: function () {
        const that = this;

        this.ipt.bind('input', function (event) {
            clearTimeout(that.searchTimer);

            const keyCode = event.keyCode;
            if (keyCode === KEY.UP || keyCode === KEY.DOWN) {
                return;
            }

            that.searchTimer = setTimeout(() => {
                that.setTerm($(this).val());
                that.refresh();
            }, 0);
        });

        keyboardJS.bind(['down', 'tab'], function(event) {
            event.preventDefault();
            if (that.isVisible()) {
                that.move('down');
            }
        });
        keyboardJS.bind(['up', 'shift + tab'], function(event) {
            event.preventDefault();
            if (that.isVisible()) {
                that.move('up');
            }
        });
        keyboardJS.bind('enter', function(event) {
            event.preventDefault();
            if (that.isVisible()) {
                that.exec();
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
        const itemNum = $('.ec-item').length;

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
        // Process the returned data, or let the user handle it
        const dataList = Reflect.apply(this.opt.onInput, this, [this.getTerm()]);

        if (dataList) {
            if (dataList instanceof Promise || typeof dataList.then === 'function') {
                dataList.then(resp => {
                    this.showItemList(resp);
                });
            } else {
                this.showItemList(dataList);
            }
        }
    },

    exec: function () {
        this.trigger('enter', $('.ec-item-select').get(0));
    },

    move: function (direction) {
        const maxIndex = $('.ec-item').length - 1;
        let selectIndex = $('.ec-item-select').data('index');

        if (direction === 'up') {
            selectIndex = selectIndex - 1;
        } else {
            selectIndex = selectIndex + 1;
        }

        if (selectIndex < 0) {
            selectIndex = maxIndex;
        } else if (selectIndex > maxIndex) {
            selectIndex = 0;
        }

        this.selectItemByIndex(selectIndex);
    },

    selectItemByIndex: function (index) {
        $('.ec-item-select').removeClass('ec-item-select');
        $(`.ec-item:eq(${index})`).addClass('ec-item-select');

        this.refreshScrollbar();
    },

    refreshScrollbar: function () {
        const $item = $('.ec-item-select');
        const $itemList = $item.parent();

        // scroll to visible
        const pH = $itemList.height();
        const pTop = $itemList.get(0).scrollTop;

        const cTop = $item.get(0).getBoundingClientRect().top - $itemList.get(0).getBoundingClientRect().top;
        const cH = $item.outerHeight();

        if (cTop < 0) {
            $itemList.scrollTop(pTop + cTop);
        } else if (cTop + cH > pH) {
            $itemList.scrollTop(pTop + cTop + cH - pH);
        }
    },

    clearList: function () {
        this.dataList = [];
        if ($('.ec-itemList').length) {
            $('.ec-itemList').remove();
        }
        this.trigger('clear');
    },

    showItemList: function (dataList, fn) {
        if (!dataList || !dataList.length) {
            this.clearList();
            return;
        }
        this.dataList = dataList;

        const createItemFn = fn || this.opt.createItem;
        const html = [
            '<div class="ec-itemList">'
        ];

        for (let i = 0, len = dataList.length; i < len; i = i + 1) {
            if (createItemFn) {
                html.push(Reflect.apply(createItemFn, this, [i, dataList[i]]));
                continue;
            }
        }

        html.push('</div>');

        const $itemList = $(html.join(''));

        const iptOffset = this.ipt.offset;
        const left = iptOffset.left;
        const top = iptOffset.top + this.ipt.css('height');

        $itemList.css({
            left: left,
            top: top
        });
        $itemList.find('.ec-item')
            .first()
            .addClass('ec-item-select');

        if (this.opt.container) {
            $(this.opt.container).html($itemList);
        }
        this.trigger('show');
    }

};

export default EasyComplete;