import util from '../../js/common/util'
import $ from 'jquery'

$.fn.isInViewport = function() {
    const elementTop = $(this).offset().top;
    const elementBottom = elementTop + $(this).outerHeight();
    const viewportTop = $(window).scrollTop();
    const viewportBottom = viewportTop + $(window).height();

    return elementBottom > viewportTop && elementTop < viewportBottom;
};

export function getElemsBySelector(selector, options = {}) {
    const scope = options.scope || 'document';
    let elems;

    if (scope === 'visible') {
        elems = $(`${selector}:visible`);
    } else {
        elems = $(selector);
    }

    return elems;
}

export function handleClickCommand(selector, options) {
    const $elem = getElemsBySelector(selector, options, 'click')[0];

    if ($elem) {
        $elem.scrollIntoView();
        $elem.click();
    } else {
        util.toast.warning('Element not found');
    }
}

export function handleHideCommand(selector, options) {
    const $elems = getElemsBySelector(selector, options, 'hide');

    $elems.hide();
}

export function handleShowCommand(selector, options) {
    const $elems = getElemsBySelector(selector, options, 'show');

    $elems.show();
}

export function handleCopyCommand(selector, options) {
    const elem = getElemsBySelector(selector, options, 'copy')[0];

    if (elem) {
        let text = elem.value || elem.innerText;

        if (options.template) {
            text = util.simTemplate(options.template, { text });
        }

        util.copyToClipboard(text, true);
    } else {
        util.toast.warning('Element not found');
    }
}

export function toggleProtect() {
    if (window.onbeforeunload) {
        window.onbeforeunload = null;
    } else {
        window.onbeforeunload = function() {
            return "This page has been protect by yourself";
        }
    }
}