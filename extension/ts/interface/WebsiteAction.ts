import { PageCommand } from '../enum/PageCommand'

export interface WebsiteAction {
    actionType: PageCommand,
    title: string,
    desc?: string,
    pattern?: string,
    selector?: string,
    extend?: object
}