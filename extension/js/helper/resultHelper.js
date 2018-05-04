

export function createUrl({url, title, icon, desc, showDesc}) {
    return {
        title,
        desc: showDesc ? (desc || url) : '',
        icon,
        universal: true,
        url,
        key: 'url'
    };
}

export function createCopy({url, title, icon, desc, showDesc}) {
    return {
        title,
        desc: showDesc ? (desc || url) : '',
        icon,
        universal: true,
        url,
        key: 'copy'
    };
}