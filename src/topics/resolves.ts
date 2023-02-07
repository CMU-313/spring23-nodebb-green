
'use strict';

import _ from 'lodash';

import db from '../database';
import utils from '../utils';
import slugify from '../slugify';
import plugins from '../plugins';
import analytics from '../analytics';
import user from '../user';
import meta from '../meta';
import posts from '../posts';
import privileges from '../privileges';
import categories from '../categories';
import translator from '../translator';

export = function (Topics) {
    Topics.markAsResolved = async function(tid, uid) {
        
    }
}