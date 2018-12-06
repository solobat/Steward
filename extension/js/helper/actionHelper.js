import PageCommand from '../../js/enum/pageCommand'

const defaultActions = [{
    title: 'Toggle TODO',
    desc: 'Add a bookmark and tag it with a TODO prefix / Remove bookmark',
    actionType: PageCommand.TOGGLE_TODO
}, {
    title: 'Toggle protection status',
    actionType: PageCommand.PAGE_PROTECT,
    protected: false,
    desc: 'Not protected'
}];

function getUserActions() {
    return Promise.resolve([]);
}

export async function getGlobalActions() {
    const userActions = await getUserActions();

    return userActions.concat(defaultActions);
}