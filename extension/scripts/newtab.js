(function() {
    if (window.localStorage.visibleOnlyFocued) {
        if (!document.hasFocus()) {
            addClass();
        }

        function removeClass() {
            document.documentElement.className = '';
            document.querySelector('#cmdbox').focus();
        }

        function addClass() {
            document.documentElement.className = 'box-invisible';
        }

        window.addEventListener('focus', removeClass, false);
        window.addEventListener('blur', addClass, false);
    }
})();