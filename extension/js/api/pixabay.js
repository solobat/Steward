import * as apiUtils from '../utils/api'

const APP_KEY = '9599926-06fed5cb1e63825bd24dd87f8';
const options = {
    editors_choice: true,
    per_page: 20
};
const URL = `https://pixabay.com/api/?key=${APP_KEY}`;

let page = 0;

export function getPageList() {
    page = page + 1;
    options.page = page;

    return apiUtils.fetch(URL, options);
}
