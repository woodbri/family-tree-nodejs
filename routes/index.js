
var dbs = require('../db-config').databases;
var getHeaderInfo = require('../utils');

/* GET home page. */
function indexRouter(req, res, next) {
    req.session.last = '';
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

module.exports = indexRouter;
