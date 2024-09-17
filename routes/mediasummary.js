import getHeaderInfo from '../utils.js';
import createConnection from '../db-config.js';
import async from 'async';

function mediaSummaryRouter(req, res, next) {

    res.locals = getHeaderInfo(req) || {};
    var isAdmin = res.locals.isAdmin;
    var isLogin = res.locals.isLogin;
    var dbName = req.params.dbName;
    var hasPhotos = res.locals.hasPhotos;

    var pool = createConnection(dbName);

    async.parallel([
        count_indi,
        count_photos,
        count_unlinked,
        getGroups
    ],
    function(err, values) {
        pool.close();
        res.render('mediasummary');
    });

    function count_indi(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = 'select count(distinct indi) as cnt from indi_photos';
            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                if (results.rowCount > 0) {
                    res.locals['num_indis'] = results.rows[0].cnt;
                }

                pool.release(conn);
                next(null, 'indis');
            });
        });
    }

    function count_photos(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = 'select count(*) as cnt from photos';
            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                if (results.rowCount > 0) {
                    res.locals['num_photos'] = results.rows[0].cnt;
                }

                pool.release(conn);
                next(null, 'photos');
            });
        });
    }


    function count_unlinked(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = `select count(*) as cnt
                from photos a left join indi_photos b on a.id=b.id
                where b.id is null`;

            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                if (results.rowCount > 0) {
                    res.locals['num_unlinked'] = results.rows[0].cnt;
                }

                pool.release(conn);
                next(null, 'unlinked');
            });
        });
    }

    function getGroups(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = 'select a.*, count(*) as cnt from pgroups a left join photos b on a.id=b.gid group by a.id order by a.id';

            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                res.locals['pgroups'] = [];
                results.rows.forEach(function (r) {
                    res.locals.pgroups.push({
                        id: r.id,
                        desc: r.desc,
                        cnt: r.cnt
                    });
                });

                pool.release(conn);
                next(null, 'groups');
            });
        });
    }

}

