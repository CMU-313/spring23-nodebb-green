"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canEdit = exports.isOwnerOrAdminOrMod = exports.isAdminOrMod = exports.canDelete = exports.canPurge = exports.filterUids = exports.filterTids = exports.can = exports.get = exports.canViewDeletedScheduled = void 0;
const lodash_1 = __importDefault(require("lodash"));
const meta_1 = __importDefault(require("../meta"));
const topics_1 = __importDefault(require("../topics"));
const user_1 = __importDefault(require("../user"));
const helpers_1 = __importDefault(require("./helpers"));
const categories_1 = __importDefault(require("../categories"));
const plugins_1 = __importDefault(require("../plugins"));
const categories_2 = __importDefault(require("./categories"));
function canViewDeletedScheduled(topic, privileges = {}, viewDeleted = false, viewScheduled = false) {
    if (!topic) {
        return false;
    }
    const { deleted = false, scheduled = false } = topic;
    const { view_deleted = viewDeleted, view_scheduled = viewScheduled } = privileges;
    // conceptually exclusive, scheduled topics deemed to be not deleted (they can only be purged)
    if (scheduled) {
        return view_scheduled;
    }
    else if (deleted) {
        return view_deleted;
    }
    return true;
}
exports.canViewDeletedScheduled = canViewDeletedScheduled;
function get(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        uid = parseInt(uid, 10);
        const privs = [
            'topics:reply', 'topics:read', 'topics:schedule', 'topics:tag',
            'topics:delete', 'posts:edit', 'posts:history',
            'posts:delete', 'posts:view_deleted', 'read', 'purge',
        ];
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicData = yield topics_1.default.getTopicFields(tid, ['cid', 'uid', 'locked', 'deleted', 'scheduled']);
        const [userPrivileges, isAdministrator, isModerator, disabled] = yield Promise.all([
            helpers_1.default.isAllowedTo(privs, uid, topicData.cid),
            user_1.default.isAdministrator(uid),
            user_1.default.isModerator(uid, topicData.cid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            categories_1.default.getCategoryField(topicData.cid, 'disabled'),
        ]);
        const privData = lodash_1.default.zipObject(privs, userPrivileges);
        const isOwner = uid > 0 && uid === topicData.uid;
        const isAdminOrMod = isAdministrator || isModerator;
        const editable = isAdminOrMod;
        const deletable = (privData['topics:delete'] && (isOwner || isModerator)) || isAdministrator;
        const mayReply = canViewDeletedScheduled(topicData, {}, false, privData['topics:schedule']);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield plugins_1.default.hooks.fire('filter:privileges.topics.get', {
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
            view_deleted: isAdminOrMod || isOwner || privData['posts:view_deleted'],
            view_scheduled: privData['topics:schedule'] || isAdministrator,
            isAdminOrMod: isAdminOrMod,
            disabled: disabled,
            tid: tid,
            uid: uid,
            resolveable: isAdminOrMod || isOwner,
            viewable: isAdminOrMod || isOwner || !topicData.privateTopic,
        });
    });
}
exports.get = get;
function can(privilege, tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cid = yield topics_1.default.getTopicField(tid, 'cid');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield categories_2.default.can(privilege, cid, uid);
    });
}
exports.can = can;
function filterTids(privilege, tids, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(tids) || !tids.length) {
            return [];
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicsData = yield topics_1.default.getTopicsFields(tids, ['tid', 'cid', 'deleted', 'scheduled']);
        const cids = lodash_1.default.uniq(topicsData.map(topic => topic.cid));
        const results = yield categories_2.default.getBase(privilege, cids, uid);
        const allowedCids = cids.filter((cid, index) => (!results.categories[index].disabled &&
            (results.allowedTo[index] || results.isAdmin)));
        const cidsSet = new Set(allowedCids);
        const canViewDeleted = lodash_1.default.zipObject(cids, results.view_deleted);
        const canViewScheduled = lodash_1.default.zipObject(cids, results.view_scheduled);
        tids = topicsData.filter(t => (cidsSet.has(t.cid) &&
            (results.isAdmin || canViewDeletedScheduled(t, {}, canViewDeleted[t.cid], canViewScheduled[t.cid])))).map(t => t.tid);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const data = yield plugins_1.default.hooks.fire('filter:privileges.topics.filter', {
            privilege: privilege,
            uid: uid,
            tids: tids,
        });
        return data ? data.tids : [];
    });
}
exports.filterTids = filterTids;
function filterUids(privilege, tid, uids) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Array.isArray(uids) || !uids.length) {
            return [];
        }
        uids = lodash_1.default.uniq(uids);
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicData = yield topics_1.default.getTopicFields(tid, ['tid', 'cid', 'deleted', 'scheduled']);
        const [disabled, allowedTo, isAdmins] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            categories_1.default.getCategoryField(topicData.cid, 'disabled'),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            helpers_1.default.isUsersAllowedTo(privilege, uids, topicData.cid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user_1.default.isAdministrator(uids),
        ]);
        if (topicData.scheduled) {
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const canViewScheduled = yield helpers_1.default.isUsersAllowedTo('topics:schedule', uids, topicData.cid);
            uids = uids.filter((uid, index) => canViewScheduled[index]);
        }
        return uids.filter((uid, index) => !disabled &&
            ((allowedTo[index] && (topicData.scheduled || !topicData.deleted)) || isAdmins[index]));
    });
}
exports.filterUids = filterUids;
function canPurge(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cid = yield topics_1.default.getTopicField(tid, 'cid');
        const [purge, owner, isAdmin, isModerator] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            categories_2.default.isUserAllowedTo('purge', cid, uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics_1.default.isOwner(tid, uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user_1.default.isAdministrator(uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user_1.default.isModerator(uid, cid),
        ]);
        return (purge && (owner || isModerator)) || isAdmin;
    });
}
exports.canPurge = canPurge;
function canDelete(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicData = yield topics_1.default.getTopicFields(tid, ['uid', 'cid', 'postcount', 'deleterUid']);
        const [isModerator, isAdministrator, isOwner, allowedTo] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user_1.default.isModerator(uid, topicData.cid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user_1.default.isAdministrator(uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics_1.default.isOwner(tid, uid),
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            helpers_1.default.isAllowedTo('topics:delete', uid, [topicData.cid]),
        ]);
        if (isAdministrator) {
            return true;
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const { preventTopicDeleteAfterReplies } = meta_1.default.config;
        if (!isModerator && preventTopicDeleteAfterReplies &&
            (topicData.postcount - 1) >= preventTopicDeleteAfterReplies) {
            const langKey = preventTopicDeleteAfterReplies > 1 ?
                // The next line calls a function in a module that has not been updated to TS yet
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                `[[error:cant-delete-topic-has-replies, ${meta_1.default.config.preventTopicDeleteAfterReplies}]]` :
                '[[error:cant-delete-topic-has-reply]]';
            throw new Error(langKey);
        }
        const { deleterUid } = topicData;
        return allowedTo[0] &&
            ((isOwner && (parseInt(deleterUid, 10) === 0 ||
                deleterUid === topicData.uid)) || isModerator);
    });
}
exports.canDelete = canDelete;
function isAdminOrMod(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        if (parseInt(uid, 10) <= 0) {
            return false;
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cid = yield topics_1.default.getTopicField(tid, 'cid');
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return yield categories_2.default.isAdminOrMod(cid, uid);
    });
}
exports.isAdminOrMod = isAdminOrMod;
function isOwnerOrAdminOrMod(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        const [isOwner, isAdminOrM] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics_1.default.isOwner(tid, uid),
            isAdminOrMod(tid, uid),
        ]);
        return isOwner || isAdminOrM;
    });
}
exports.isOwnerOrAdminOrMod = isOwnerOrAdminOrMod;
function canEdit(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield isOwnerOrAdminOrMod(tid, uid);
    });
}
exports.canEdit = canEdit;
