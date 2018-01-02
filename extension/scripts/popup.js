(function() {
    function initTheme(mode) {
        const themesStr = window.localStorage.getItem('themes');

        if (themesStr) {
            const themes = JSON.parse(themesStr);

            if (themes[mode]) {
                let cssText = '';
                const theme = themes[mode];

                for (const prop in theme) {
                    cssText += `${prop}: ${theme[prop]};`;
                }

                document.querySelector('html').style.cssText = cssText;
            }
        }
    }

    if (window.parent === window) {
        initTheme('popup');
    } else {
        initTheme('page');
    }
})();