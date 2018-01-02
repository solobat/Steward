(function() {
    function getBg() {
        return localStorage.getItem('wallpaper');
    }

    function initTheme(mode) {
        const themesStr = window.localStorage.getItem('themes');

        if (themesStr) {
            const themes = JSON.parse(themesStr);

            if (themes[mode]) {
                let cssText = '';
                const theme = themes[mode];
                const bg = getBg();

                if (bg) {
                    theme['--app-newtab-background-image'] = `url(${bg})`;
                }

                for (const prop in theme) {
                    cssText += `${prop}: ${theme[prop]};`;
                }

                document.querySelector('html').style.cssText = cssText;
            }
        }
    }

    initTheme('newtab');

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

    if (window.localStorage.newTabUseFilter) {
        document.documentElement.className += ' use-filter';
    }

    if (window.localStorage.titleType === 'random') {
        chrome.storage.local.get('titleNotes', function(resp) {
            const notes = resp.titleNotes;

            if (notes && notes.length) {
                document.title = notes[Math.floor(Math.random() * notes.length)];
            }
        });
    } else {
        const newTabTitle = window.localStorage.newTabTitle;

        if (typeof newTabTitle !== 'undefined') {
            document.title = newTabTitle;
        }
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