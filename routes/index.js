
var dbs = require('../db-config').databases;
var getHeaderInfo = require('../utils');

/* GET home page. */
function indexRouter(req, res, next) {
    var resData = getHeaderInfo(req);
    var list = [];
    for (var dbname in dbs) {
        list.push({
            name: dbname,
            title: dbs[dbname].params.title,
            owner: dbs[dbname].params.owner,
            email: dbs[dbname].params.email
        });
    }
    resData['dbs'] = list;
    resData['title'] = 'Genealogy Web Server';
    res.render('index', resData);
};

module.exports = indexRouter;
