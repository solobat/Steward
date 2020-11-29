import { Plugin } from 'plugins/type';
import wordcard from './wordcard'

export const extPlugins: Plugin[] = [
    wordcard
]

chrome.management.getAll(function (extList) {
    const enabledExts = extList.filter(function (ext) {
        return ext.enabled;
    });

    const enabledExtNames = enabledExts.map(ext => ext.name);

    extPlugins.forEach(plugin => {
        const matchIndex = enabledExtNames.indexOf(plugin.extName);

        if (matchIndex !== -1) {
            plugin.setup(enabledExts[matchIndex]);
        } else {
            plugin.invalid = true;
        }
    });
});