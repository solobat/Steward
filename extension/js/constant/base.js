
export const PLUGIN_TYPE = {
    ALWAYS: 'always',
    REGEXP: 'regexp',
    KEYWORD: 'keyword',
    OTHER: 'other',
    SEARCH: 'search'
};

export const EMPTY_COMMAND = '_empty_';

export const ITEM_TYPE = {
    PLUGINS: 'plugins',
    URL: 'url',
    COPY: 'copy',
    ACTION: 'action',
    APP: 'app'
};

export const MODE = {
    NEWTAB: 'newTab',
    POPUP: 'popup'
};

export const EXTENSION = {
    ALFRED: 'alfred',
    STEWARD: 'steward'
};

export const PLUGIN_STATUS = {
    NOTINSTALL: 0,
    NEWVESION: 1,
    INSTALLED: 2
};

export const alfredTabs = ['Alfred', 'General', 'Plugins', 'Workflows', 'Websites', 'Wallpapers', 'Appearance', 'Advanced', 'Help', 'Update'];

export const stewardTabs = ['Steward', 'General', 'Plugins', 'Workflows', 'Websites', 'Wallpapers', 'Appearance', 'Advanced', 'Help', 'Update'];
