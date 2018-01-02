
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
    label: 'Bing',
    value: 'bing',
    tips: 'faster, but less'
}, {
    label: 'Unsplash',
    value: 'picsum',
    tips: 'lower, but more'
}];