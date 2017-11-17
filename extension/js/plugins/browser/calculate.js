/**
 * @description calculate
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import util from '../../common/util'
import mathexp from 'math-expression-evaluator'

const name = 'calculate';
const version = 3;
const type = 'regexp';
const key = 'calc';
const icon = chrome.extension.getURL('img/calc.png');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
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

function onInput(query) {
    let data = [];
    if (this.term.startsWith('calc ') && query) {
        this.render(query);
        return;
    }
    try {
        const result = mathexp.eval(this.str);
        data = [
            {
                key: title,
                icon: icon,
                title: result,
                desc: subtitle
            }
        ];
    } catch (e) {
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
    const text = item.title;

    util.copyToClipboard(text, true);

    return Promise.resolve(false);
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