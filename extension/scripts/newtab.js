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


    const updateClass = action => cls => {
        let clsArr = document.documentElement.className.trim().split(' ').filter(item => Boolean(item));

        if (clsArr.indexOf(cls) === -1) {
            if (action === 'add') {
                clsArr.push(cls);
            } else {
                return;
            }
        } else {
            if (action === 'remove') {
                clsArr = clsArr.filter(item => item !== cls);
            } else {
                return;
            }
        }

        document.documentElement.className = clsArr.join(' ');
    }

    const addClass = updateClass('add');
    const removeClass = updateClass('remove');

    if (window.localStorage.visibleOnlyFocued) {
        const className = 'box-invisible';

        if (!document.hasFocus()) {
            addClass(className);
        }

        function removeClassAsync(cls) {
            requestAnimationFrame(function() {
                removeClass(cls);
                document.querySelector('#cmdbox').focus();
            });
        }

        window.addEventListener('focus', function() {
            removeClassAsync(className);
        }, false);
        window.addEventListener('blur', function() {
            addClass(className);
        }, false);
    }

    if (window.localStorage.newTabUseFilter) {
        addClass('use-filter');
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
        addClass(`size-${boxSize}`);
    }

    window.addEventListener('beforeunload', function () {
        window.stewardApp && window.stewardApp.emit('beforeleave');
        document.querySelector('#main').style.display = 'none';
    });
})();