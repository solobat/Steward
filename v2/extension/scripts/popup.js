(function () {
    function initTheme(mode) {
        chrome.storage.sync.get('themes', function (resp) {
            const themes = resp.themes

            if (themes && themes[mode]) {
                let cssText = '';
                const theme = themes[mode];

                for (const prop in theme) {
                    cssText += `${prop}: ${theme[prop]};`;
                }

                document.querySelector('html').style.cssText = cssText;
            }
        })
    }

    if (window.parent === window) {
        initTheme('popup');
    } else {
        initTheme('page');
    }
})();