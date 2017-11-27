
export const APPEARANCE_ITEMS = [{
    name: 'wallpapers',
    icon: '/img/wallpaper-icon.png'
}, {
    name: 'themes',
    icon: '/img/themes-icon.png'
}]

export const DEFAULT_PLUGINS = ['Top Sites', 'Bookmarks', 'Tabs', 'Weather', 'Other', 'Random'].map(name => {
    return {
        label: name,
        value: name
    }
})
