/**
 * @description calculate
 * @author  tomasy
 * @mail solopea@gmail.com
 */

import util from '../../common/util'
import mathexp from 'math-expression-evaluator'

const name = 'calculate';
const version = 4;
const type = 'always';
const key = 'calc';
const icon = chrome.extension.getURL('iconfont/calc.svg');
const title = chrome.i18n.getMessage(`${name}_title`);
const subtitle = chrome.i18n.getMessage(`${name}_subtitle`);
const commands = [{
    key,
    type,
    title,
    subtitle,
    icon,
    editable: false
}];

function onInput(query) {
    let data = [];
    if (query.startsWith('calc ') && query) {
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
        data = null;
    }

    return Promise.resolve(data);
}

function onEnter(item) {
    const text = item.title;

    util.copyToClipboard(text, true);

    return Promise.resolve(false);
}

export default {
    version,
    name: 'Calculator',
    category: 'other',
    icon,
    title,
    commands,
    onInput,
    onEnter,
    canDisabled: false
};