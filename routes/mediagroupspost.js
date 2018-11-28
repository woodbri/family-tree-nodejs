function mediaGroupsPostRouter(req, res, next) {
    var getHeaderInfo = require('../utils');
    var resData = getHeaderInfo(req);
    var isAdmin = resData.isAdmin;
    var isLogin = resData.isLogin;
    var dbName = req.params.dbName;
    var hasPhotos = resData.hasPhotos;

    var dbName = req.params.dbName;
    var url = '/' + dbName + '/media/summary';

    if (isAdmin && hasPhotos) {
        var sql, params;
        var action = req.body.action.toLowerCase();
        switch (action) {
            case 'add':
                sql = 'insert into pgroups (desc) values (?)';
                params = [req.body.desc];
                break;
            case 'upd':
                sql = 'update pgroups set desc=? where id=?';
                params = [req.body.desc, req.body.id];
                break;
            case 'del':
                sql = 'delete from pgroups where id=?';
                params = [req.body.id];
                break;
            default:
                console.log({action: action});
                res.redirect(url);
                return;
                break;
        }
        var pool = require('../db-config').createConnection(dbName);
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

                if (action == 'del') {
                    var sql2 = 'update photos set gid = NULL where gid=?';
                    conn.query(sql2, params, function(err, results) {
                        if (err) {
                            console.error(err);
                            next(err);
                        }

                        pool.release(conn);
                        pool.close();

                        req.app.locals.pgroups = null;
                        res.redirect(url);
                    });
                }
                else {
                    pool.release(conn);
                    pool.close();

                    req.app.locals.pgroups = null;
                    res.redirect(url);
                }
            });
        });
    }
    else {
        res.redirect(url);
    }
}

module.exports = mediaGroupsPostRouter;

