//'use strict';

import nconf = require('nconf');

const databaseName: string = nconf.get('database');
const winston = require('winston');

interface data_type {
    index: number,
    
}

if (!databaseName) {
    winston.error(new Error('Database type not set! Run ./nodebb setup'));
    process.exit();
}

const primaryDB = require(`./${databaseName}`);

primaryDB.parseIntFields = function (data: any, intFields, requestedFields) {
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

primaryDB.initSessionStore = async function () {
    const sessionStoreConfig = nconf.get('session_store') || nconf.get('redis') || nconf.get(databaseName);
    let sessionStoreDB = primaryDB;

    if (nconf.get('session_store')) {
        sessionStoreDB = require(`./${sessionStoreConfig.name}`);
    } else if (nconf.get('redis')) {
        // if redis is specified, use it as session store over others
        sessionStoreDB = require('./redis');
    }

    primaryDB.sessionStore = await sessionStoreDB.createSessionStore(sessionStoreConfig);
};

module.exports = primaryDB;
