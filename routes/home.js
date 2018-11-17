var fs = require('fs');
var path = require('path');
var getHeaderInfo = require('../utils');

/* GET About */
function homeRouter(req, res, next) {
    var resData = getHeaderInfo(req);
    var temp = path.join(__dirname, '..', 'db', req.params.dbName, req.params.dbName + '.about');
    fs.readFile(temp, function(err, data) {
        if (err) {
            res.send('Error: database "' + req.params.dbName + '" is not loaded!');
            return;
        }

        resData['content'] = data;
        res.render('home', resData);
    });
};

module.exports = homeRouter;

