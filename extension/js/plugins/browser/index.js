import jenkins from './jenkins'
import note from './note'
import diary from './diary'
import tab from './tab'
import on from './on'
import off from './off'
import set from './set'
import del from './del'
import run from './run'
import his from './his'
import bookmark from './bookmark'
import yd from './yd'
import todo from './todo'
import times from './times'
import pocket from './pocket'
import calculate from './calculate'
import urlblock from './urlblock'
import download from './download'
import help from './help'
import topsites from './topsites'
import weather from './weather'
import openurl from './openurl'
import newtab from './newtab'
import wallpaper from './wallpaper'
import search from './search'
import extensions from './extensions'
import chrome from './chrome'
import steward from './steward'
import custom from './custom'
import random from './random'
import workflow from './workflow'
import about from './about'
import { extPlugins } from './extension'

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
});

export const plugins = pluginList