
export const PLUGIN_DEFAULT = `
module.exports = function (steward) {
    const version = 1;
    const author = 'solobat';
    const name = 'yourPlugin';
    const key = 'xxx';
    const type = 'keyword';
    const icon = 'http://static.oksteward.com/icon128.png';
    const title = 'your plugin';
    const subtitle = 'custom your plugin';
    const commands = [{
        key,
        type,
        title,
        subtitle,
        icon
    }];

    function onInput(query, command) {
        // return a promise 
        return Promise.resolve([
            {
                icon,
                key: 1,
                title: 'result 1',
                desc: 'desc 1'
            },
            {
                icon,
                key: 2,
                title: 'result 2',
                desc: 'desc 2'
            }
        ]);
    }

    function onEnter(item, command, query, keyStatus, list) {
        steward.util.copyToClipboard(item.title, true);
    }

    return {
        author,
        version,
        name,
        category: 'other',
        icon,
        title,
        commands,
        onInput,
        onEnter
    };
}
`;