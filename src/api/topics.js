"use strict";
// 'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unfollow = exports.ignore = exports.follow = exports.unlock = exports.lock = exports.unpin = exports.pin = exports.purge = exports.resolve = exports.restore = exports.del = exports.reply = exports.create = exports.get = void 0;
const user = require("../user");
const topics = require("../topics");
const posts = require("../posts");
const meta = require("../meta");
const privileges = require("../privileges");
const apiHelpers = require("./helpers");
const websockets = require("../socket.io");
const socketHelpers = require("../socket.io/helpers");
const { doTopicAction } = apiHelpers;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function get(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const [userPrivileges, topic] = yield Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            privileges.topics.get(data.tid, caller.uid),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics.getTopicData(data.tid),
        ]);
        if (!topic ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            !userPrivileges.read ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            !userPrivileges['topics:read'] ||
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            !privileges.topics.canViewDeletedScheduled(topic, userPrivileges)) {
            return null;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return topic;
    });
}
exports.get = get;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function create(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!data) {
            throw new Error('[[error:invalid-data]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = Object.assign({}, data);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        payload.tags = payload.tags || [];
        apiHelpers.setDefaultPostData(caller, payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isScheduling = parseInt(data.timeStamp, 10) > payload.timestamp;
        if (isScheduling) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (yield privileges.categories.can('topics:schedule', data.cid, caller.uid)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                payload.timestamp = parseInt(data.timeStamp, 10);
            }
            else {
                throw new Error('[[error:no-privileges]]');
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield meta.blacklist.test(caller.ip);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const shouldQueue = yield posts.shouldQueue(caller.uid, payload);
        if (shouldQueue) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield posts.addToQueue(payload);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const result = yield topics.post(payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics.thumbs.migrate(data.uuid, result.topicData.tid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        socketHelpers.emitToUids('event:new_post', { posts: [result.postData] }, [caller.uid]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        socketHelpers.emitToUids('event:new_topic', result.topicData, [caller.uid]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        socketHelpers.notifyNew(caller.uid, 'newTopic', { posts: [result.postData], topic: result.topicData });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return result.topicData;
    });
}
exports.create = create;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function reply(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (!data || !data.tid || (meta.config.minimumPostLength !== 0 && !data.content)) {
            throw new Error('[[error:invalid-data]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = Object.assign({}, data);
        apiHelpers.setDefaultPostData(caller, payload);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield meta.blacklist.test(caller.ip);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const shouldQueue = yield posts.shouldQueue(caller.uid, payload);
        if (shouldQueue) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return yield posts.addToQueue(payload);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const postData = yield topics.reply(payload);
        // postData seems to be a subset of postObj, refactor?
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const postObj = yield posts.getPostSummaryByPids([postData.pid], caller.uid, {});
        const result = {
            posts: [postData],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            'reputation:disabled': meta.config['reputation:disabled'] === 1,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            'downvote:disabled': meta.config['downvote:disabled'] === 1,
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        user.updateOnlineUsers(caller.uid);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (caller.uid) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            socketHelpers.emitToUids('event:new_post', result, [caller.uid]);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        }
        else if (caller.uid === 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            websockets.in('online_guests').emit('event:new_post', result);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        socketHelpers.notifyNew(caller.uid, 'newPost', result);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return postObj[0];
    });
}
exports.reply = reply;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function del(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('delete', 'event:topic_deleted', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.del = del;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function restore(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('restore', 'event:topic_restored', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.restore = restore;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// added resolve function API
function resolve(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('resolve', 'event:topic_resolved', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.resolve = resolve;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function purge(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('purge', 'event:topic_purged', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.purge = purge;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function pin(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('pin', 'event:topic_pinned', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.pin = pin;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function unpin(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('unpin', 'event:topic_unpinned', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.unpin = unpin;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function lock(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('lock', 'event:topic_locked', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.lock = lock;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function unlock(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield doTopicAction('unlock', 'event:topic_unlocked', caller, {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tids: data.tids,
        });
    });
}
exports.unlock = unlock;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function follow(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics.follow(data.tid, caller.uid);
    });
}
exports.follow = follow;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function ignore(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics.ignore(data.tid, caller.uid);
    });
}
exports.ignore = ignore;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
function unfollow(caller, data) {
    return __awaiter(this, void 0, void 0, function* () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics.unfollow(data.tid, caller.uid);
    });
}
exports.unfollow = unfollow;
