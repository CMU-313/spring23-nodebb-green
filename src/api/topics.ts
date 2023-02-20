// 'use strict';

import user = require('../user');
import topics = require('../topics');
import posts = require('../posts');
import meta = require('../meta');
import privileges = require('../privileges');

import apiHelpers = require('./helpers');
import websockets = require('../socket.io');
import socketHelpers = require('../socket.io/helpers');

const { doTopicAction } = apiHelpers;
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
const topicsAPI = module.exports;

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.get = async function (caller, data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const [userPrivileges, topic] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        privileges.topics.get(data.tid, caller.uid),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        topics.getTopicData(data.tid),
    ]);
    if (
        !topic ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        !userPrivileges.read ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        !userPrivileges['topics:read'] ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        !privileges.topics.canViewDeletedScheduled(topic, userPrivileges)
    ) {
        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return topic;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.create = async function (caller, data) {
    if (!data) {
        throw new Error('[[error:invalid-data]]');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const payload = { ...data };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    payload.tags = payload.tags || [];
    apiHelpers.setDefaultPostData(caller, payload);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const isScheduling = parseInt(data.timestamp, 10) > payload.timestamp;
    if (isScheduling) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (await privileges.categories.can('topics:schedule', data.cid, caller.uid)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            payload.timestamp = parseInt(data.timestamp, 10);
        } else {
            throw new Error('[[error:no-privileges]]');
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await meta.blacklist.test(caller.ip);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const shouldQueue = await posts.shouldQueue(caller.uid, payload);
    if (shouldQueue) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await posts.addToQueue(payload);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const result = await topics.post(payload);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.thumbs.migrate(data.uuid, result.topicData.tid);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    socketHelpers.emitToUids('event:new_post', { posts: [result.postData] }, [caller.uid]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    socketHelpers.emitToUids('event:new_topic', result.topicData, [caller.uid]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    socketHelpers.notifyNew(caller.uid, 'newTopic', { posts: [result.postData], topic: result.topicData });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return result.topicData;
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.reply = async function (caller, data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (!data || !data.tid || (meta.config.minimumPostLength !== 0 && !data.content)) {
        throw new Error('[[error:invalid-data]]');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const payload = { ...data };
    apiHelpers.setDefaultPostData(caller, payload);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await meta.blacklist.test(caller.ip);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const shouldQueue = await posts.shouldQueue(caller.uid, payload);
    if (shouldQueue) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return await posts.addToQueue(payload);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const postData = await topics.reply(payload); // postData seems to be a subset of postObj, refactor?
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const postObj = await posts.getPostSummaryByPids([postData.pid], caller.uid, {});

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
    } else if (caller.uid === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        websockets.in('online_guests').emit('event:new_post', result);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    socketHelpers.notifyNew(caller.uid, 'newPost', result);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return postObj[0];
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.delete = async function (caller, data) {
    await doTopicAction('delete', 'event:topic_deleted', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.restore = async function (caller, data) {
    await doTopicAction('restore', 'event:topic_restored', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
// added resolve function API
topicsAPI.resolve = async function (caller, data) {
    await doTopicAction('resolve', 'event:topic_resolved', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.purge = async function (caller, data) {
    await doTopicAction('purge', 'event:topic_purged', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.pin = async function (caller, data) {
    await doTopicAction('pin', 'event:topic_pinned', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.unpin = async function (caller, data) {
    await doTopicAction('unpin', 'event:topic_unpinned', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.lock = async function (caller, data) {
    await doTopicAction('lock', 'event:topic_locked', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.unlock = async function (caller, data) {
    await doTopicAction('unlock', 'event:topic_unlocked', caller, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids: data.tids,
    });
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.follow = async function (caller, data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.follow(data.tid, caller.uid);
};

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.ignore = async function (caller, data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.ignore(data.tid, caller.uid);
};
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
topicsAPI.unfollow = async function (caller, data) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await topics.unfollow(data.tid, caller.uid);
};
