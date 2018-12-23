function getGroupsRouter(req, res, next) {
    if (! req.app.locals) req.app['locals'] = {};
    if (! req.app.locals.pgroups) {
        req.app.locals['pgroups'] = [{id: 0, desc:  'Ungrouped Photo'}];
        var pool = require('../db-config').createConnection(req.params.dbName);
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = 'select * from pgroups order by id desc';
            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                if (results && results.rowCount > 0) {
                    results.rows.forEach(function(r) {
                        req.app.locals.pgroups.push({id: r.id, desc: r.desc});
                    });
                    pool.release(conn);
                    pool.close();
                    next(null);
                }
                else {
                    pool.release(conn);
                    pool.close();
                    next(null);
                }
            });
        });
    }
    else {
        next(null);
    }
}

module.exports = getGroupsRouter;
