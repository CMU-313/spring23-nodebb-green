/* eslint-disable @typescript-eslint/no-unsafe-member-access */

// 'use strict';

// import _ from 'lodash';
import _ from 'lodash';
import meta from '../meta';
import topics from '../topics';
import user from '../user';
import helpers from './helpers';
import categories from '../categories';
import plugins from '../plugins';
import privsCategories from './categories';

interface Privileges {
    view_deleted?: boolean;
    view_scheduled?: boolean;
}
interface Topic {
    deleted?: boolean;
    scheduled?: boolean;
}
interface topicData {
    deleterUid? : number
}
export function canViewDeletedScheduled(topic: Topic, privileges = {} as Privileges,
    viewDeleted = false, viewScheduled = false): boolean {
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


export async function get(tid, uid) {
    uid = parseInt(uid as string, 10);

    const privs = [
        'topics:reply', 'topics:read', 'topics:schedule', 'topics:tag',
        'topics:delete', 'posts:edit', 'posts:history',
        'posts:delete', 'posts:view_deleted', 'read', 'purge',
    ];
    // eslint-disable-next-line max-len
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const topicData = await topics.getTopicFields(tid, ['cid', 'uid', 'locked', 'deleted', 'scheduled']);
    const userPrivileges = await new Promise(helpers.isAllowedTo(privs, uid, topicData.cid));
    const isAdministrator: boolean = await new Promise(user.isAdministrator(uid));
    const isModerator: boolean = await new Promise(helpers.isAllowedTo(privs, uid, topicData.cid));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const disabled: boolean = await new Promise(categories.getCategoryField(topicData.cid, 'disabled'));
    const privData = _.zipObject(privs, userPrivileges as _.List<unknown>);
    const isOwner: boolean = uid > 0 && uid === (topicData.uid as number);
    const isAdminOrMod_data: boolean = isAdministrator || isModerator;
    const editable: boolean = isAdminOrMod_data;
    const deletable: boolean = (privData['topics:delete'] && (isOwner || isModerator)) || isAdministrator;
    const mayReply: boolean = canViewDeletedScheduled(topicData as Topic, {}, false, privData['topics:schedule'] as boolean);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await plugins.hooks.fire('filter:privileges.topics.get', {
        'topics:reply': (privData['topics:reply'] && ((!topicData.locked && mayReply) || isModerator)) || isAdministrator,
        'topics:read': privData['topics:read'] || isAdministrator,
        'topics:schedule': privData['topics:schedule'] || isAdministrator,
        'topics:tag': privData['topics:tag'] || isAdministrator,
        'topics:delete': (privData['topics:delete'] && (isOwner || isModerator)) || isAdministrator,
        'posts:edit': (privData['posts:edit'] && (!topicData.locked || isModerator)) || isAdministrator,
        'posts:history': privData['posts:history'] || isAdministrator,
        'posts:delete': (privData['posts:delete'] && (!topicData.locked || isModerator)) || isAdministrator,
        'posts:view_deleted': privData['posts:view_deleted'] || isAdministrator,
        read: privData.read || isAdministrator,
        purge: (privData.purge && (isOwner || isModerator)) || isAdministrator,

        view_thread_tools: editable || deletable,
        editable: editable,
        deletable: deletable,
        view_deleted: isAdminOrMod_data || isOwner || privData['posts:view_deleted'],
        view_scheduled: privData['topics:schedule'] || isAdministrator,
        isAdminOrMod: isAdminOrMod_data,
        disabled: disabled,
        tid: tid as number,
        uid: uid as number,
        viewable: isAdminOrMod_data || isOwner || !topicData.privateTopic,
    });
}

export async function can(privilege, tid, uid) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const cid = await topics.getTopicField(tid, 'cid');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await privsCategories.can(privilege, cid, uid);
}

export async function filterTids(privilege, tids, uid): Promise<number []> {
    if (!Array.isArray(tids) || !tids.length) {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const topicsData = await topics.getTopicsFields(tids, ['tid', 'cid', 'deleted', 'scheduled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const cids = _.uniq(topicsData.map(topic => topic.cid as number));
    const results = await privsCategories.getBase(privilege, cids, uid);

    const allowedCids = cids.filter((cid, index) => (
        !results.categories[index].disabled &&
        (results.allowedTo[index] || results.isAdmin)
    ));

    const cidsSet = new Set(allowedCids);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const canViewDeleted = _.zipObject(cids as _.List<_.PropertyName>, results.view_deleted);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const canViewScheduled = _.zipObject(cids as _.List<_.PropertyName>, results.view_scheduled);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    tids = topicsData.filter(t => (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        cidsSet.has(t.cid) &&
        // eslint-disable-next-line max-len
        (results.isAdmin || canViewDeletedScheduled(t as Topic, {}, canViewDeleted[t.cid] as boolean, canViewScheduled[t.cid] as boolean))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    )).map(t => t.tid);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await plugins.hooks.fire('filter:privileges.topics.filter', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        privilege: privilege,
        uid: uid as number,
        tids: tids as number,
    });
    return data ? data.tids as number [] : [];
}

export async function filterUids(privilege, tid, uids) {
    if (!Array.isArray(uids) || !uids.length) {
        return [];
    }

    uids = _.uniq(uids);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const topicData = await topics.getTopicFields(tid, ['tid', 'cid', 'deleted', 'scheduled']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [disabled, allowedTo, isAdmins] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        categories.getCategoryField(topicData.cid, 'disabled'),
        helpers.isUsersAllowedTo(privilege, uids, topicData.cid),
        user.isAdministrator(uids),
    ]);

    if (topicData.scheduled) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const canViewScheduled = await helpers.isUsersAllowedTo('topics:schedule', uids, topicData.cid);
        // eslint-disable-next-line max-len
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
        uids = uids.filter((uid, index) => canViewScheduled[index]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return uids.filter((uid, index) => !disabled &&
            ((allowedTo[index] && (topicData.scheduled || !topicData.deleted)) || isAdmins[index]));
}

export async function canPurge(tid, uid): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const cid = await topics.getTopicField(tid, 'cid');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [purge, owner, isAdmin, isModerator] = await Promise.all([
        privsCategories.isUserAllowedTo('purge', cid, uid),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        topics.isOwner(tid, uid),
        user.isAdministrator(uid),
        user.isModerator(uid, cid),
    ]);
    return (purge as boolean && (owner as boolean || isModerator as boolean)) || isAdmin as boolean;
}

export async function canDelete(tid, uid): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const topicData = await topics.getTopicFields(tid, ['uid', 'cid', 'postcount', 'deleterUid']);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [isModerator, isAdministrator, isOwner, allowedTo] = await Promise.all([
        user.isModerator(uid, topicData.cid),
        user.isAdministrator(uid),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        topics.isOwner(tid, uid),
        helpers.isAllowedTo('topics:delete', uid, [topicData.cid]),
    ]);

    if (isAdministrator) {
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { preventTopicDeleteAfterReplies } = meta.config;
    if (!isModerator && preventTopicDeleteAfterReplies && (topicData.postcount - 1) >= preventTopicDeleteAfterReplies) {
        const langKey = preventTopicDeleteAfterReplies > 1 ?
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `[[error:cant-delete-topic-has-replies, ${meta.config.preventTopicDeleteAfterReplies}]]` :
            '[[error:cant-delete-topic-has-reply]]';
        throw new Error(langKey);
    }

    const { deleterUid } = topicData as topicData;
    return allowedTo[0] as boolean && ((isOwner as boolean &&
        (deleterUid === 0 || deleterUid === topicData.uid)) || isModerator as boolean);
}

export async function isAdminOrMod(tid: string, uid): Promise<boolean> {
    if (parseInt(uid as string, 10) <= 0) {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const cid = await topics.getTopicField(tid, 'cid') as number;
    return await privsCategories.isAdminOrMod(cid, uid) as boolean;
}

export async function isOwnerOrAdminOrMod(tid, uid): Promise<boolean> {
    const [isOwner, isAdminOrMod_data] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        topics.isOwner(tid, uid) as boolean,
        isAdminOrMod(tid as string, uid),
    ]);
    return isOwner || isAdminOrMod_data;
}

export async function canEdit(tid, uid): Promise<boolean> {
    return await isOwnerOrAdminOrMod(tid, uid);
}
