(function() {
    let newtabSrc
    function createIframe(src) {
        document.documentElement.className += ' use-iframe ';
        newtabSrc = src;
    }

    function checkNewTab() {
        chrome.storage.sync.get('newtabSrc', ({ newtabSrc }) => {
            if (newtabSrc) {
                createIframe(newtabSrc)
            }
        })
    }

    checkNewTab()
    function getBg() {
        return localStorage.getItem('wallpaper');
    }

    function initTheme(mode) {
        chrome.storage.sync.get('themes', function (resp) {
            const themes = resp.themes

            if (themes && themes[mode]) {
                let cssText = '';
                const theme = themes[mode];
                const bg = getBg();

                if (bg.startsWith('#')) {
                    theme['--app-newtab-background-image'] = bg;
                    theme['--newtab-background-color'] = bg;
                } else {
                    theme['--app-newtab-background-image'] = `url(${bg})`;
                }

                for (const prop in theme) {
                    cssText += `${prop}: ${theme[prop]};`;
                }

                document.querySelector('html').style.cssText = cssText;
            }
        })
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
        if (window.Steward && window.Steward.app.emit) {
            window.Steward.app.emit('beforeleave');
        }
        document.querySelector('#main').style.display = 'none';
    });

    window.addEventListener('DOMContentLoaded', () => {
        if (newtabSrc) {
            const iframe = document.getElementById('newtab');
            iframe.src = newtabSrc;
        }
    });
})();