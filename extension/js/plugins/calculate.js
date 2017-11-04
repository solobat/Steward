/**
 * @description calculate
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import $ from 'jquery'
import util from '../common/util'
import mathexp from 'math-expression-evaluator'

const name = 'calculate';
const version = 3;
const type = 'regexp';
const key = 'calc';
const icon = chrome.extension.getURL('img/calc.png');
const title = chrome.i18n.getMessage(name + '_title');
const subtitle = chrome.i18n.getMessage(name + '_subtitle');
const regExp = /^([-+]?)([\d\.]+)(?:\s*([-+*\/])\s*((?:\s[-+])?[\d\.]+)?\s*)+$/;
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: false,
    regExp
}];

function onInput(key) {
    var data = [];
    if (this.term.startsWith('calc ') && key) {
        this.render(key);
        return;
    }
    try {
        let result = mathexp.eval(this.str);
        data = [
            {
                key: title,
                icon: icon,
                title: result,
                desc: subtitle
            }
        ];
    }
    catch (e) {
        data = [
            {
                key: title,
                icon: icon,
                title: '...',
                desc: 'Please enter a valid expression'
            }
        ];
    }

    return data;
}

function onEnter(item) {
    let text = item.title;

    util.copyToClipboard(text, true);
}

export default {
    version,
    name: 'Calculator',
    icon,
    title,
    commands,
    onInput,
    onEnter
};