const storageFactory = (storgaeArea) => (action) => (key, defaultValue) => {
    return new Promise((resolve, reject) => {
        if (action === 'clear') {
            storgaeArea[action](resp => resolve(resp));
        } else if (action === 'get') {
            storgaeArea[action](key, resp => {
                if (resp[key]) {
                    resolve(resp[key]);
                } else if (defaultValue) {
                    resolve(defaultValue);
                } else {
                    resolve(null);
                }
            });
        } else {
            storgaeArea[action](key, resp => resolve(resp));
        }
    });
}

const actions = ['get', 'set', 'remove', 'clear'];
let storage = {};

['sync', 'local'].forEach(storageArea => {
    let factory = storageFactory(chrome.storage[storageArea]);

    let methods = storage[storageArea] = {};
    actions.forEach(action => {
        methods[action] = factory(action);
    });
});

export default storage;