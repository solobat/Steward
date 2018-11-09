/*global EXT_TYPE */

import $ from 'jquery'
import configHelper from './configHelper'
import workflowHelper from './workflowHelper'
import websitesHelper from './websites'
import wallpaperHelper from './wallpaper'
import themeHelper from './themeHelper'

const manifest = chrome.runtime.getManifest();
const version = manifest.version;
const extType = EXT_TYPE === 'stewardlite' ? 'Steward Lite' : 'steward';

export const dataHelpers = [configHelper, workflowHelper, websitesHelper, wallpaperHelper, themeHelper];

export function downloadAsJson(exportObj, exportName) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportObj))}`;
    const downloadAnchorNode = document.createElement('a');

    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${exportName}.json`);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

export function backup() {
    const tasks = dataHelpers.map(helper => helper.getData());

    Promise.all(tasks).then(([config, workflows, websites, wallpapers, themes]) => {
        const data = {
            config,
            workflows,
            websites,
            wallpapers,
            themes,
            meta: {
                version,
                export_at: Number(new Date()),
                app: extType
            }
        };

        console.log(data);
        downloadAsJson(data, 'Steward-Backup');
    });
}

export function restoreData(data, config) {
    const tasks = dataHelpers.map(helper => {
        let obj = data[helper.key];

        if (helper.key === 'config') {
            obj = $.extend(true, config, obj);
        }

        if (obj) {
            return helper.setData(obj);
        } else {
            return Promise.resolve(null);
        }
    });

    return Promise.all(tasks);
}