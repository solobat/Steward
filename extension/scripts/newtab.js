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

    const boxSize = window.localStorage.boxSize;
    const optionalSize = ['normal', 'large'];

    if (optionalSize.indexOf(boxSize) !== -1) {
        document.documentElement.className += ` size-${boxSize}`
    }

    window.addEventListener('beforeunload', function () {
        document.querySelector('#main').style.display = 'none';
    });
})();