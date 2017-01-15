define(function(require, exports, module) {
    function format(date = new Date()) {
        let ret = [
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate()
        ].join('-');

        return ret;
    }

    exports.format = format;

    exports.isNewDate = function(date, last) {
        return format(date) !== format(last);
    }
});
