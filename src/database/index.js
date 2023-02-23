"use strict";
//'use strict';
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
const nconf = require("nconf");
const databaseName = nconf.get('database');
const winston = require('winston');
if (!databaseName) {
    winston.error(new Error('Database type not set! Run ./nodebb setup'));
    process.exit();
}
const primaryDB = require(`./${databaseName}`);
primaryDB.parseIntFields = function (data, intFields, requestedFields) {
    intFields.forEach((field) => {
        if (!requestedFields || !requestedFields.length || requestedFields.includes(field)) {
            data[field] = parseInt(data[field], 10) || 0;
        }
    });
};
primaryDB.parseBooleanFields = function (data, booleanFields, requestedFields) {
    booleanFields.forEach((field) => {
        if (!requestedFields || !requestedFields.length || requestedFields.includes(field)) {
            data[field] = (typeof data[field] === 'boolean' && data[field]) || data[field] === 'true';
        }
    });
};
primaryDB.initSessionStore = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionStoreConfig = nconf.get('session_store') || nconf.get('redis') || nconf.get(databaseName);
        let sessionStoreDB = primaryDB;
        if (nconf.get('session_store')) {
            sessionStoreDB = require(`./${sessionStoreConfig.name}`);
        }
        else if (nconf.get('redis')) {
            // if redis is specified, use it as session store over others
            sessionStoreDB = require('./redis');
        }
        primaryDB.sessionStore = yield sessionStoreDB.createSessionStore(sessionStoreConfig);
    });
};
module.exports = primaryDB;
