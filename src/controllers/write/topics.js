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
exports.deleteEvent = exports.getEvents = exports.reorderThumbs = exports.deleteThumb = exports.migrateThumbs = exports.addThumb = exports.getThumbs = exports.deleteTags = exports.addTags = exports.unfollow = exports.ignore = exports.follow = exports.unlock = exports.lock = exports.unpin = exports.pin = exports.purge = exports.restore = exports.resolve = exports.deleteTopic = exports.reply = exports.create = exports.get = void 0;
const validator_1 = __importDefault(require("validator"));
const lodash_1 = __importDefault(require("lodash"));
const database_1 = __importDefault(require("../../database"));
const api_1 = __importDefault(require("../../api"));
const topics_1 = __importDefault(require("../../topics"));
const privileges_1 = __importDefault(require("../../privileges"));
const plugins_1 = __importDefault(require("../../plugins"));
const helpers_1 = __importDefault(require("../helpers"));
const middleware_1 = __importDefault(require("../../middleware"));
const uploads_1 = __importDefault(require("../uploads"));
const get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield helpers_1.default.formatApiResponse(200, res, yield api_1.default.topics.get(req, req.params));
});
exports.get = get;
function lockPosting(req, error) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.uid > 0 ? req.uid : req.sessionID;
        const value = `posting${id}`;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const count = yield database_1.default.incrObjectField('locks', value);
        if (count > 1) {
            throw new Error(error);
        }
        return value;
    });
}
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = yield lockPosting(req, '[[error:already-posting]]');
    try {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = yield api_1.default.topics.create(req, req.body);
        if (payload.queued) {
            yield helpers_1.default.formatApiResponse(202, res, payload);
        }
        else {
            yield helpers_1.default.formatApiResponse(200, res, payload);
        }
    }
    finally {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield database_1.default.deleteObjectField('locks', id);
    }
});
exports.create = create;
const reply = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = yield lockPosting(req, '[[error:already-posting]]');
    try {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = yield api_1.default.topics.reply(req, Object.assign(Object.assign({}, req.body), { tid: req.params.tid }));
        yield helpers_1.default.formatApiResponse(200, res, payload);
    }
    finally {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield database_1.default.deleteObjectField('locks', id);
    }
});
exports.reply = reply;
const deleteTopic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.del(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.deleteTopic = deleteTopic;
function resolveTopic(tid, uid) {
    return __awaiter(this, void 0, void 0, function* () {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const topicData = yield topics_1.default.getTopicFields(tid, ['tid', 'uid', 'cid']);
        if (!topicData || !topicData.cid) {
            throw new Error('[[error:no-topic]]');
        }
        const isOwnerOrAdminOrMod = yield privileges_1.default.topics.isOwnerOrAdminOrMod(tid, uid);
        if (!isOwnerOrAdminOrMod) {
            throw new Error('[[error:no-privileges]]');
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics_1.default.setTopicField(tid, 'resolve', true);
        topicData.resolve = true;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield plugins_1.default.hooks.fire('action:topic.resolve', { topic: lodash_1.default.clone(topicData), uid: uid });
        return topicData;
    });
}
// added resolved field
const resolve = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield resolveTopic(req.params.tid, req.uid);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.resolve = resolve;
const restore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.restore(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.restore = restore;
const purge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.purge(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.purge = purge;
const pin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Pin expiry was not available w/ sockets hence not included in api lib method
    if (req.body.expiry) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield topics_1.default.tools.setPinExpiry(req.params.tid, req.body.expiry, req.uid);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.pin(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.pin = pin;
const unpin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.unpin(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.unpin = unpin;
const lock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.lock(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.lock = lock;
const unlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.unlock(req, { tids: [req.params.tid] });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.unlock = unlock;
const follow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.follow(req, req.params);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.follow = follow;
const ignore = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.ignore(req, req.params);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.ignore = ignore;
const unfollow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield api_1.default.topics.unfollow(req, req.params);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.unfollow = unfollow;
const addTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield privileges_1.default.topics.canEdit(req.params.tid, req.user.uid))) {
        return helpers_1.default.formatApiResponse(403, res);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cid = yield topics_1.default.getTopicField(req.params.tid, 'cid');
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield topics_1.default.validateTags(req.body.tags, cid, req.user.uid, req.params.tid);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const tags = yield topics_1.default.filterTags(req.body.tags);
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield topics_1.default.addTags(tags, [req.params.tid]);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.addTags = addTags;
const deleteTags = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield privileges_1.default.topics.canEdit(req.params.tid, req.user.uid))) {
        return helpers_1.default.formatApiResponse(403, res);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield topics_1.default.deleteTopicTags(req.params.tid);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.deleteTags = deleteTags;
const getThumbs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // post_uuids can be passed in occasionally, in that case no checks are necessary
    if (isFinite(parseInt(req.params.tid, 10))) {
        const [exists, canRead] = yield Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics_1.default.exists(req.params.tid),
            privileges_1.default.topics.can('topics:read', req.params.tid, req.uid),
        ]);
        if (!exists || !canRead) {
            return helpers_1.default.formatApiResponse(403, res);
        }
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield helpers_1.default.formatApiResponse(200, res, yield topics_1.default.thumbs.get(req.params.tid));
});
exports.getThumbs = getThumbs;
function checkThumbPrivileges({ tid, uid, res }) {
    return __awaiter(this, void 0, void 0, function* () {
        // req.params.tid could be either a tid (pushing a new thumb to an existing topic)
        // or a post UUID (a new topic being composed)
        const isUUID = validator_1.default.isUUID(tid);
        // Sanity-check the tid if it's strictly not a uuid
        if (!isUUID && (isNaN(parseInt(tid, 10)) || !(yield topics_1.default.exists(tid)))) {
            return helpers_1.default.formatApiResponse(404, res, new Error('[[error:no-topic]]'));
        }
        // While drafts are not protected, tids are
        if (!isUUID && !(yield privileges_1.default.topics.canEdit(tid, uid))) {
            return helpers_1.default.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
        }
    });
}
const addThumb = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }
    const files = yield uploads_1.default.uploadThumb(req, res); // response is handled here
    // Add uploaded files to topic zset
    if (files && files.length) {
        yield Promise.all(files.map((fileObj) => __awaiter(void 0, void 0, void 0, function* () {
            yield topics_1.default.thumbs.associate({
                id: req.params.tid,
                path: fileObj.path || fileObj.url,
            });
        })));
    }
});
exports.addThumb = addThumb;
const migrateThumbs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res }),
        checkThumbPrivileges({ tid: req.body.tid, uid: req.user.uid, res }),
    ]);
    if (res.headersSent) {
        return;
    }
    yield topics_1.default.thumbs.migrate(req.params.tid, req.body.tid);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.migrateThumbs = migrateThumbs;
const deleteThumb = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.body.path.startsWith('http')) {
        middleware_1.default.assert.path(req, res, () => { console.log('complete'); });
        if (res.headersSent) {
            return;
        }
    }
    yield checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }
    yield topics_1.default.thumbs.delete(req.params.tid, req.body.path);
    yield helpers_1.default.formatApiResponse(200, res, yield topics_1.default.thumbs.get(req.params.tid));
});
exports.deleteThumb = deleteThumb;
const reorderThumbs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }
    const exists = yield topics_1.default.thumbs.exists(req.params.tid, req.body.path);
    if (!exists) {
        return helpers_1.default.formatApiResponse(404, res);
    }
    yield topics_1.default.thumbs.associate({
        id: req.params.tid,
        path: req.body.path,
        score: req.body.order,
    });
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.reorderThumbs = reorderThumbs;
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield privileges_1.default.topics.can('topics:read', req.params.tid, req.uid))) {
        return helpers_1.default.formatApiResponse(403, res);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield helpers_1.default.formatApiResponse(200, res, yield topics_1.default.events.get(req.params.tid, req.uid));
});
exports.getEvents = getEvents;
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield privileges_1.default.topics.isAdminOrMod(req.params.tid, req.uid))) {
        return helpers_1.default.formatApiResponse(403, res);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    yield topics_1.default.events.purge(req.params.tid, [req.params.eventId]);
    yield helpers_1.default.formatApiResponse(200, res);
});
exports.deleteEvent = deleteEvent;
