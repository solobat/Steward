import jenkins from './jenkins'
import note from './note'
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
import pocket from './pocket'
import calculate from './calculate' 
import urlblock from './urlblock'
import download from './download'
import help from './help'
import topsites from './topsites'
import weather from './weather'

var pluginList = [
    jenkins,
    note,
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
    pocket,
    calculate,
    urlblock,
    download,
    help,
    topsites,
    weather
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