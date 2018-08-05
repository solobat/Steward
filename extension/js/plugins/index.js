// browser plugins
import bookmark from './browser/bookmark'
import chrome from './browser/chrome'
import del from './browser/del'
import download from './browser/download'
import extensions from './browser/extensions'
import his from './browser/his'
import off from './browser/off'
import on from './browser/on'
import run from './browser/run'
import set from './browser/set'
import tab from './browser/tab'
import topsites from './browser/topsites'

// extension plugins
import { extPlugins } from './extension'

// other plugins
import calculate from './other/calculate'
import coin from './other/coin'
import diary from './other/diary'
import jenkins from './other/jenkins'
import note from './other/note'
import openurl from './other/openurl'
import pocket from './other/pocket'
import search from './other/search'
import times from './other/times'
import todo from './other/todo'
import urlblock from './other/urlblock'
import weather from './other/weather'
import yd from './other/yd'

// steward plugins
import about from './steward/about'
import custom from './steward/custom'
import help from './steward/help'
import newtab from './steward/newtab'
import random from './steward/random'
import steward from './steward/steward'
import wallpaper from './steward/wallpaper'
import workflow from './steward/workflow'

const pluginList = [
    about,
    jenkins,
    note,
    diary,
    tab,
    on,
    off,
    set,
    del,
    run,
    his,
    bookmark,
    yd,
    todo,
    times,
    pocket,
    calculate,
    urlblock,
    download,
    help,
    topsites,
    weather,
    coin,
    openurl,
    newtab,
    wallpaper,
    search,
    extensions,
    chrome,
    steward,
    custom,
    random,
    workflow,
    ...extPlugins
]

// orkey: original key
pluginList.forEach(plugin => {
    if (plugin.commands) {
        plugin.commands.forEach(command => {
            if (!command.orkey) {
                command.orkey = command.key;
            }
        });
    }

    if (plugin.canDisabled) {
        plugin.disabled = false;
    }
});

export const plugins = pluginList