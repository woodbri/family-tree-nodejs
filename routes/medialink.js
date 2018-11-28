function mediaLinkRouter(req, res, next) {

    // if req.query.add
    //      'insert or ignore into indi_photos (indi, id) values(?,?)',
    //      [req.query.add, req.params.id]
    //
    // if req.query.del
    //      'delete from indi_photos where indi=? and id=?',
    //      [req.query.del, req.params.id]
    //
    // res.redirect('/dbName/media/edit/' + req.params.id);

    var dbName = req.params.dbName;
    var id = req.params.id;
    var mode, indi;

    if (req.session && req.session.admin) {

        if (req.query && req.query.del) {
            mode = 'del';
            indi = req.query.del;
        }
        else if (req.query && req.query.add) {
            mode = 'add';
            indi = req.query.add;
        }
        else {
            next(createError('Invalid operation!'));
            return;
        }

        if (isNaN(parseInt(id)) || ! indi.match(/^I\d+$/)) {
            next(createError("parameter(s) are not valid!"));
            return;
        }

        var pool = require('../db-config').createConnection(dbName);
        var sql;
        var params = [indi, id];

        if (mode == 'add') {
            sql = 'insert or ignore into indi_photos (indi, id) values(?,?)';
        }
        else if (mode == 'del') {
            sql = 'delete from indi_photos where indi=? and id=?';
        }

        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            conn.query(sql, params, function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }
                pool.release(conn);
                pool.close()
                res.redirect('/' + dbName + '/media/edit/' + id);
            });
        });
    }
    else {
        res.redirect('/' + dbName + '/media/edit/' + id);
    }
}

module.exports = mediaLinkRouter;

