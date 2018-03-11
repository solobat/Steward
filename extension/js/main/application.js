import { backup } from '../helper'

export default {
    hanldle(action) {
        switch (action.title) {
            case 'Backup':
                backup();
                break;
            default:
                break;
        }
    }
}