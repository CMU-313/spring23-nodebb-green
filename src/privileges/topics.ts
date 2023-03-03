import _ from 'lodash';

import meta from '../meta';
import topics from '../topics';
import user from '../user';
import helpers from './helpers';
import categories from '../categories';
import plugins from '../plugins';
import privsCategories from './categories';
import { CategoryObject, TopicObject } from '../types';

interface Result {
    categories: CategoryObject[];
    allowedTo: boolean[];
    isAdmin: boolean[];
    view_deleted: boolean[];
    view_scheduled: boolean[];
}

export function canViewDeletedScheduled(topic: TopicObject,
    privileges: { view_deleted?: boolean, view_scheduled?: boolean } = {},
    viewDeleted = false, viewScheduled = false) {
    if (!topic) {
        return false;
    }
    const { deleted = false, scheduled = false } = topic;
    const { view_deleted = viewDeleted, view_scheduled = viewScheduled } = privileges;

    // conceptually exclusive, scheduled topics deemed to be not deleted (they can only be purged)
    if (scheduled) {
        return view_scheduled;
    } else if (deleted) {
        return view_deleted;
    }

    return true;
}

export async function get(tid: string, uid: string | number): Promise<TopicObject> {
    uid = parseInt(uid as string, 10);

    const privs = [
        'topics:reply', 'topics:read', 'topics:schedule', 'topics:tag',
        'topics:delete', 'posts:edit', 'posts:history',
        'posts:delete', 'posts:view_deleted', 'read', 'purge',
    ];

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const TopicObject = await topics.getTopicFields(tid, ['cid', 'uid', 'locked', 'deleted', 'scheduled']) as TopicObject;
    const [userPrivileges, isAdministrator, isModerator, disabled] = await Promise.all([
        helpers.isAllowedTo(privs, uid, TopicObject.cid) as boolean[],
        user.isAdministrator(uid) as boolean,
        user.isModerator(uid, TopicObject.cid) as boolean,
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        categories.getCategoryField(TopicObject.cid, 'disabled') as boolean,
    ]);
    const privData = _.zipObject(privs, userPrivileges);
    const isOwner = uid > 0 && uid === TopicObject.uid;
    const isAdminOrMod = isAdministrator || isModerator;
    const editable = isAdminOrMod;
    const deletable = (privData['topics:delete'] && (isOwner || isModerator)) || isAdministrator;
    const mayReply = canViewDeletedScheduled(TopicObject, {}, false, privData['topics:schedule']);

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await plugins.hooks.fire('filter:privileges.topics.get', {
        'topics:reply': (privData['topics:reply'] && ((!TopicObject.locked && mayReply) || isModerator)) || isAdministrator,
        'topics:read': privData['topics:read'] || isAdministrator,
        'topics:schedule': privData['topics:schedule'] || isAdministrator,
        'topics:tag': privData['topics:tag'] || isAdministrator,
        'topics:delete': (privData['topics:delete'] && (isOwner || isModerator)) || isAdministrator,
        'posts:edit': (privData['posts:edit'] && (!TopicObject.locked || isModerator)) || isAdministrator,
        'posts:history': privData['posts:history'] || isAdministrator,
        'posts:delete': (privData['posts:delete'] && (!TopicObject.locked || isModerator)) || isAdministrator,
        'posts:view_deleted': privData['posts:view_deleted'] || isAdministrator,
        read: privData.read || isAdministrator,
        purge: (privData.purge && (isOwner || isModerator)) || isAdministrator,

        view_thread_tools: editable || deletable,
        editable: editable,
        deletable: deletable,
        view_deleted: isAdminOrMod || isOwner || privData['posts:view_deleted'],
        view_scheduled: privData['topics:schedule'] || isAdministrator,
        isAdminOrMod: isAdminOrMod,
        disabled: disabled,
        tid: tid,
        uid: uid,
        resolveable: isAdminOrMod || isOwner,
        viewable: isAdminOrMod || isOwner || !TopicObject.privateTopic,
    }) as TopicObject;
}

export async function can(privilege: string, tid: string | number, uid: string | number) {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cid = await topics.getTopicField(tid, 'cid') as (string | number);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await privsCategories.can(privilege, cid, uid) as (string | number);
}

export async function filterTids(privilege: string, tids: (string | number)[], uid: (string | number)) {
    if (!Array.isArray(tids) || !tids.length) {
        return [];
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const topicsData = await topics.getTopicsFields(tids, ['tid', 'cid', 'deleted', 'scheduled']) as TopicObject[];
    const cids = _.uniq(topicsData.map(topic => topic.cid));
    const results = await privsCategories.getBase(privilege, cids, uid) as Result;

    const allowedCids = cids.filter((cid, index) => (
        !results.categories[index].disabled &&
        (results.allowedTo[index] || results.isAdmin)
    ));

    const cidsSet = new Set(allowedCids);
    const canViewDeleted = _.zipObject(cids, results.view_deleted);
    const canViewScheduled = _.zipObject(cids, results.view_scheduled);

    tids = topicsData.filter(t => (
        cidsSet.has(t.cid) &&
        (results.isAdmin || canViewDeletedScheduled(t, {}, canViewDeleted[t.cid], canViewScheduled[t.cid]))
    )).map(t => t.tid);

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const data = await plugins.hooks.fire('filter:privileges.topics.filter', {
        privilege: privilege,
        uid: uid,
        tids: tids,
    }) as { tids: (string | number)[] };
    return data ? data.tids : [];
}

export async function filterUids(privilege, tid, uids) {
    if (!Array.isArray(uids) || !uids.length) {
        return [];
    }

    uids = _.uniq(uids);
    const TopicObject = await topics.getTopicFields(tid, ['tid', 'cid', 'deleted', 'scheduled']);
    const [disabled, allowedTo, isAdmins] = await Promise.all([
        categories.getCategoryField(TopicObject.cid, 'disabled'),
        helpers.isUsersAllowedTo(privilege, uids, TopicObject.cid),
        user.isAdministrator(uids),
    ]);

    if (TopicObject.scheduled) {
        const canViewScheduled = await helpers.isUsersAllowedTo('topics:schedule', uids, TopicObject.cid);
        uids = uids.filter((uid, index) => canViewScheduled[index]);
    }

    return uids.filter((uid, index) => !disabled &&
        ((allowedTo[index] && (TopicObject.scheduled || !TopicObject.deleted)) || isAdmins[index]));
};

export async function canPurge(tid, uid) {
    const cid = await topics.getTopicField(tid, 'cid');
    const [purge, owner, isAdmin, isModerator] = await Promise.all([
        privsCategories.isUserAllowedTo('purge', cid, uid),
        topics.isOwner(tid, uid),
        user.isAdministrator(uid),
        user.isModerator(uid, cid),
    ]);
    return (purge && (owner || isModerator)) || isAdmin;
};

export async function canDelete(tid, uid) {
    const TopicObject = await topics.getTopicFields(tid, ['uid', 'cid', 'postcount', 'deleterUid']);
    const [isModerator, isAdministrator, isOwner, allowedTo] = await Promise.all([
        user.isModerator(uid, TopicObject.cid),
        user.isAdministrator(uid),
        topics.isOwner(tid, uid),
        helpers.isAllowedTo('topics:delete', uid, [TopicObject.cid]),
    ]);

    if (isAdministrator) {
        return true;
    }

    const { preventTopicDeleteAfterReplies } = meta.config;
    if (!isModerator && preventTopicDeleteAfterReplies && (TopicObject.postcount - 1) >= preventTopicDeleteAfterReplies) {
        const langKey = preventTopicDeleteAfterReplies > 1 ?
            `[[error:cant-delete-topic-has-replies, ${meta.config.preventTopicDeleteAfterReplies}]]` :
            '[[error:cant-delete-topic-has-reply]]';
        throw new Error(langKey);
    }

    const { deleterUid } = TopicObject;
    return allowedTo[0] && ((isOwner && (deleterUid === 0 || deleterUid === TopicObject.uid)) || isModerator);
};

export async function canEdit(tid, uid) {
    return await privsTopics.isOwnerOrAdminOrMod(tid, uid);
};

export async function isOwnerOrAdminOrMod(tid, uid) {
    const [isOwner, isAdminOrMod] = await Promise.all([
        topics.isOwner(tid, uid),
        privsTopics.isAdminOrMod(tid, uid),
    ]);
    return isOwner || isAdminOrMod;
};

export async function isAdminOrMod(tid, uid) {
    if (parseInt(uid, 10) <= 0) {
        return false;
    }
    const cid = await topics.getTopicField(tid, 'cid');
    return await privsCategories.isAdminOrMod(cid, uid);
}
