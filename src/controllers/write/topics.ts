import validator from 'validator';
import _ from 'lodash';

import db from '../../database';
import api from '../../api';
import topics from '../../topics';
import privileges from '../../privileges';
import plugins from '../../plugins';

import helpers from '../helpers';
import middleware from '../../middleware';
import uploadsController from '../uploads';

export const get = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    helpers.formatApiResponse(200, res, await api.topics.get(req, req.params));
};

export const create = async (req, res) => {
    const id = await lockPosting(req, '[[error:already-posting]]');
    try {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await api.topics.create(req, req.body);
        if (payload.queued) {
            helpers.formatApiResponse(202, res, payload);
        } else {
            helpers.formatApiResponse(200, res, payload);
        }
    } finally {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectField('locks', id);
    }
};

export const reply = async (req, res) => {
    const id = await lockPosting(req, '[[error:already-posting]]');
    try {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await api.topics.reply(req, { ...req.body, tid: req.params.tid });
        helpers.formatApiResponse(200, res, payload);
    } finally {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectField('locks', id);
    }
};

async function lockPosting(req, error) {
    const id = req.uid > 0 ? req.uid : req.sessionID;
    const value = `posting${id}`;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const count = await db.incrObjectField('locks', value);
    if (count > 1) {
        throw new Error(error);
    }
    return value;
}

export const deleteTopic = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.delete(req, { tids: [req.params.tid] });
    helpers.formatApiResponse(200, res);
};

// added resolved field
export const resolve = async (req, res) => {
    await resolveTopic(req.params.tid, req.uid);
    helpers.formatApiResponse(200, res);
};

async function resolveTopic(tid, uid) {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const topicData = await topics.getTopicFields(tid, ['tid', 'uid', 'cid']);
    if (!topicData || !topicData.cid) {
        throw new Error('[[error:no-topic]]');
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const isOwnerOrAdminOrMod = await privileges.topics.isOwnerOrAdminOrMod(tid, uid);
    if (!isOwnerOrAdminOrMod) {
        throw new Error('[[error:no-privileges]]');
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.setTopicField(tid, 'resolve', true);

    topicData.resolve = true;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    plugins.hooks.fire('action:topic.resolve', { topic: _.clone(topicData), uid: uid });
    return topicData;
}

export const restore = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.restore(req, { tids: [req.params.tid] });

    helpers.formatApiResponse(200, res);
};

export const purge = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.purge(req, { tids: [req.params.tid] });
    helpers.formatApiResponse(200, res);
};

export const pin = async (req, res) => {
    // Pin expiry was not available w/ sockets hence not included in api lib method
    if (req.body.expiry) {
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await topics.tools.setPinExpiry(req.params.tid, req.body.expiry, req.uid);
    }
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.pin(req, { tids: [req.params.tid] });

    helpers.formatApiResponse(200, res);
};

export const unpin = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.unpin(req, { tids: [req.params.tid] });
    helpers.formatApiResponse(200, res);
};

export const lock = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.lock(req, { tids: [req.params.tid] });
    helpers.formatApiResponse(200, res);
};

export const unlock = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.unlock(req, { tids: [req.params.tid] });
    helpers.formatApiResponse(200, res);
};

export const follow = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.follow(req, req.params);
    helpers.formatApiResponse(200, res);
};

export const ignore = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.ignore(req, req.params);
    helpers.formatApiResponse(200, res);
};

export const unfollow = async (req, res) => {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.topics.unfollow(req, req.params);
    helpers.formatApiResponse(200, res);
};

export const addTags = async (req, res) => {
    if (!await privileges.topics.canEdit(req.params.tid, req.user.uid)) {
        return helpers.formatApiResponse(403, res);
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cid = await topics.getTopicField(req.params.tid, 'cid');

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.validateTags(req.body.tags, cid, req.user.uid, req.params.tid);

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const tags = await topics.filterTags(req.body.tags);

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.addTags(tags, [req.params.tid]);
    helpers.formatApiResponse(200, res);
};

export const deleteTags = async (req, res) => {
    if (!await privileges.topics.canEdit(req.params.tid, req.user.uid)) {
        return helpers.formatApiResponse(403, res);
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.deleteTopicTags(req.params.tid);
    helpers.formatApiResponse(200, res);
};

export const getThumbs = async (req, res) => {
    if (isFinite(req.params.tid)) { // post_uuids can be passed in occasionally, in that case no checks are necessary
        const [exists, canRead] = await Promise.all([
            // The next line calls a function in a module that has not been updated to TS yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            topics.exists(req.params.tid),
            privileges.topics.can('topics:read', req.params.tid, req.uid),
        ]);
        if (!exists || !canRead) {
            return helpers.formatApiResponse(403, res);
        }
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    helpers.formatApiResponse(200, res, await topics.thumbs.get(req.params.tid));
};

export const addThumb = async (req, res) => {
    await checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }

    const files = await uploadsController.uploadThumb(req, res); // response is handled here

    // Add uploaded files to topic zset
    if (files && files.length) {
        await Promise.all(files.map(async (fileObj) => {
            await topics.thumbs.associate({
                id: req.params.tid,
                path: fileObj.path || fileObj.url,
            });
        }));
    }
};

export const migrateThumbs = async (req, res) => {
    await Promise.all([
        checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res }),
        checkThumbPrivileges({ tid: req.body.tid, uid: req.user.uid, res }),
    ]);
    if (res.headersSent) {
        return;
    }

    await topics.thumbs.migrate(req.params.tid, req.body.tid);
    helpers.formatApiResponse(200, res);
};

export const deleteThumb = async (req, res) => {
    if (!req.body.path.startsWith('http')) {
        await middleware.assert.path(req, res, () => { });
        if (res.headersSent) {
            return;
        }
    }

    await checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }

    await topics.thumbs.delete(req.params.tid, req.body.path);
    helpers.formatApiResponse(200, res, await topics.thumbs.get(req.params.tid));
};

export const reorderThumbs = async (req, res) => {
    await checkThumbPrivileges({ tid: req.params.tid, uid: req.user.uid, res });
    if (res.headersSent) {
        return;
    }

    const exists = await topics.thumbs.exists(req.params.tid, req.body.path);
    if (!exists) {
        return helpers.formatApiResponse(404, res);
    }

    await topics.thumbs.associate({
        id: req.params.tid,
        path: req.body.path,
        score: req.body.order,
    });
    helpers.formatApiResponse(200, res);
};

async function checkThumbPrivileges({ tid, uid, res }) {
    // req.params.tid could be either a tid (pushing a new thumb to an existing topic)
    // or a post UUID (a new topic being composed)
    const isUUID = validator.isUUID(tid);

    // Sanity-check the tid if it's strictly not a uuid
    if (!isUUID && (isNaN(parseInt(tid, 10)) || !await topics.exists(tid))) {
        return helpers.formatApiResponse(404, res, new Error('[[error:no-topic]]'));
    }

    // While drafts are not protected, tids are
    if (!isUUID && !await privileges.topics.canEdit(tid, uid)) {
        return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }
}

export const getEvents = async (req, res) => {
    if (!await privileges.topics.can('topics:read', req.params.tid, req.uid)) {
        return helpers.formatApiResponse(403, res);
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    helpers.formatApiResponse(200, res, await topics.events.get(req.params.tid, req.uid));
};

export const deleteEvent = async (req, res) => {
    if (!await privileges.topics.isAdminOrMod(req.params.tid, req.uid)) {
        return helpers.formatApiResponse(403, res);
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.events.purge(req.params.tid, [req.params.eventId]);

    helpers.formatApiResponse(200, res);
};
