"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connect_multiparty_1 = __importDefault(require("connect-multiparty"));
const middleware_1 = __importDefault(require("../../middleware"));
const controllers_1 = __importDefault(require("../../controllers"));
const helpers_1 = __importDefault(require("../helpers"));
const { setupApiRoute } = helpers_1.default;
function default_1() {
    const middlewares = [middleware_1.default.ensureLoggedIn];
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const multipartMiddleware = (0, connect_multiparty_1.default)();
    setupApiRoute(express_1.Router, 'post', '/', [middleware_1.default.checkRequired.bind(null, ['cid', 'title', 'content'])], controllers_1.default.write.topics.create);
    setupApiRoute(express_1.Router, 'get', '/:tid', [], controllers_1.default.write.topics.get);
    setupApiRoute(express_1.Router, 'post', '/:tid', [middleware_1.default.checkRequired.bind(null, ['content']), middleware_1.default.assert.topic], controllers_1.default.write.topics.reply);
    setupApiRoute(express_1.Router, 'delete', '/:tid', [...middlewares], controllers_1.default.write.topics.purge);
    setupApiRoute(express_1.Router, 'put', '/:tid/state', [...middlewares], controllers_1.default.write.topics.restore);
    setupApiRoute(express_1.Router, 'delete', '/:tid/state', [...middlewares], controllers_1.default.write.topics.deleteTopic);
    setupApiRoute(express_1.Router, 'put', '/:tid/pin', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.pin);
    setupApiRoute(express_1.Router, 'delete', '/:tid/pin', [...middlewares], controllers_1.default.write.topics.unpin);
    // set API router to resolve
    setupApiRoute(express_1.Router, 'put', '/:tid/resolve', [...middlewares], controllers_1.default.write.topics.resolve);
    setupApiRoute(express_1.Router, 'put', '/:tid/lock', [...middlewares], controllers_1.default.write.topics.lock);
    setupApiRoute(express_1.Router, 'delete', '/:tid/lock', [...middlewares], controllers_1.default.write.topics.unlock);
    setupApiRoute(express_1.Router, 'put', '/:tid/follow', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.follow);
    setupApiRoute(express_1.Router, 'delete', '/:tid/follow', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.unfollow);
    setupApiRoute(express_1.Router, 'put', '/:tid/ignore', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.ignore);
    setupApiRoute(express_1.Router, 'delete', '/:tid/ignore', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.unfollow); // intentional, unignore == unfollow
    setupApiRoute(express_1.Router, 'put', '/:tid/tags', [...middlewares, middleware_1.default.checkRequired.bind(null, ['tags']), middleware_1.default.assert.topic], controllers_1.default.write.topics.addTags);
    setupApiRoute(express_1.Router, 'delete', '/:tid/tags', [...middlewares, middleware_1.default.assert.topic], controllers_1.default.write.topics.deleteTags);
    setupApiRoute(express_1.Router, 'get', '/:tid/thumbs', [], controllers_1.default.write.topics.getThumbs);
    setupApiRoute(express_1.Router, 'post', '/:tid/thumbs', [multipartMiddleware, middleware_1.default.validateFiles, middleware_1.default.uploads.ratelimit, ...middlewares], controllers_1.default.write.topics.addThumb);
    setupApiRoute(express_1.Router, 'put', '/:tid/thumbs', [...middlewares, middleware_1.default.checkRequired.bind(null, ['tid'])], controllers_1.default.write.topics.migrateThumbs);
    setupApiRoute(express_1.Router, 'delete', '/:tid/thumbs', [...middlewares, middleware_1.default.checkRequired.bind(null, ['path'])], controllers_1.default.write.topics.deleteThumb);
    setupApiRoute(express_1.Router, 'put', '/:tid/thumbs/order', [...middlewares, middleware_1.default.checkRequired.bind(null, ['path', 'order'])], controllers_1.default.write.topics.reorderThumbs);
    setupApiRoute(express_1.Router, 'get', '/:tid/events', [middleware_1.default.assert.topic], controllers_1.default.write.topics.getEvents);
    setupApiRoute(express_1.Router, 'delete', '/:tid/events/:eventId', [middleware_1.default.assert.topic], controllers_1.default.write.topics.deleteEvent);
    return express_1.Router;
}
exports.default = default_1;
