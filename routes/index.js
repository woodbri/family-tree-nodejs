
import databases from '../db-config.js';
const dbs = databases;

import getHeaderInfo from '../utils.js';

/* GET home page. */
export default function indexRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    var list = [];
    for (var dbname in dbs) {
        list.push({
            name: dbname,
            title: dbs[dbname].params.title,
            owner: dbs[dbname].params.owner,
            email: dbs[dbname].params.email
        });
    }
    res.locals['dbs'] = list;
    res.locals['title'] = 'Genealogy Web Server';
    res.render('index');
};

