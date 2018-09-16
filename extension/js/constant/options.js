
export const APPEARANCE_ITEMS = [{
    name: 'New Tab'
}, {
    name: 'Popup'
}, {
    name: 'Page'
}]

export const DEFAULT_PLUGINS = ['Top Sites', 'Bookmarks', 'Tabs', 'Weather', 'Other', 'Random'].map(name => {
    return {
        label: name,
        value: name
    }
})

export const WALLPAPER_SOURCES = [{
    label: 'Favorites',
    value: 'favorites',
    tips: 'Your favorites'
}, {
    label: 'Bing',
    value: 'bing',
    tips: 'faster, but less'
}, {
    label: 'Unsplash',
    value: 'picsum',
    tips: 'lower, but more'
}, {
    label: 'Nasa',
    value: 'nasa',
    tips: 'NASA'
}, {
    label: 'Desktoppr',
    value: 'desktoppr',
    tips: 'desktoppr.co'
}, {
    label: 'Pixabay',
    value: 'pixabay',
    tips: 'pixabay.com'
}];

export const NEWTAB_WIDGETS = [{
    label: 'Clock',
    value: 'clock',
    tips: 'Clock'
}, {
    label: 'Shortcuts',
    value: 'shortcuts',
    tips: 'Shortcuts'
}, {
    label: 'Bottom Buttons',
    value: 'wpbtns',
    tips: 'Bottom Buttons'
}];
