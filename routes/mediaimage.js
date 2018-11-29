var fs = require('fs');

function mediaImageRouter(req, res, next) {
    var dbName = req.params.dbName;
    var mode = req.params.mode;
    var file = req.params.file;
    var dbs = require('../db-config.js');
    if (! dbName || ! dbs.databases[dbName] ||
        ! mode || ! mode.match(/^(orig|web|thumb)$/) ||
        ! file || ! file.match(/\.(jpg|tif|gif|png)$/)) {
        res.sendStatus(404);
    }
    var filename =  './media/' + dbName + '/' + mode + '/' + file;
    fs.access(filename, fs.constants.R_OK, (err) => {
        if (err) {
            console.error(err);
            next(err);
        }
        else {
            res.sendFile(filename, {root: __dirname + '/../'}, (err) => {});
        }
    });
}

module.exports = mediaImageRouter;
