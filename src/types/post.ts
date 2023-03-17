import { CategoryObject } from './category'
import { TopicObject } from './topic'
import { UserObjectSlim } from './user'

export type PostObject = {
    pid: number
    tid: number
    content: string
    uid: number | string
    timestamp: number
    deleted: boolean
    upvotes: number
    downvotes: number
    votes: number
    timestampISO: string
    user: UserObjectSlim
    topic: TopicObject
    category: CategoryObject
    isMainPost: boolean
    replies: number
}

export type PostObjectPartial = {
    pid?: number
    tid?: number
    content?: string
    uid?: number | string
    timestamp?: number
    deleted?: boolean
    upvotes?: number
    downvotes?: number
    votes?: number
    timestampISO?: string
    user?: UserObjectSlim
    topic?: TopicObject
    category?: CategoryObject
    isMainPost?: boolean
    replies?: number
    isMain?: boolean
    ip?: number
    index?: number
    bookmarked?: boolean
    display_edit_tools?: true
    display_delete_tools?: boolean
    display_moderator_tools?: boolean
    display_move_tools?: boolean
    selfPost?: boolean
}
