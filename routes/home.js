var fs = require('fs');
var path = require('path');
var getHeaderInfo = require('../utils');

/* GET About */
function homeRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    var temp = path.join(__dirname, '..', 'db', req.params.dbName, req.params.dbName + '.about');
    fs.readFile(temp, function(err, data) {
        if (err) {
            res.send('Error: database "' + req.params.dbName + '" is not loaded!');
            return;
        }

        res.locals['content'] = data;
        res.render('home');
    });
};

module.exports = homeRouter;

