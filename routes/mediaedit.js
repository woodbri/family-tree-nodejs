const fileext = {
    jpeg: '.jpg',
    png: '.png',
    webp: '.webp',
    tiff: '.tif',
    gif: '.gif',
    svg: '.svg'
};

function mediaEditRouter(req, res, next) {
    var getHeaderInfo = require('../utils');
    res.locals = getHeaderInfo(req) || {};
    var isAdmin = res.locals.isAdmin;
    var isLogin = res.locals.isLogin;
    var dbName = req.params.dbName;
    var id = req.params.id;
    if (req.query.id && ! isNaN(parseInt(req.query.id))) {
        id = String(req.query.id);
    }
    if (! id || ! id.match(/^\d+$/)) {
        res.sendStatus(404);
        return;
    }

    var pool = require('../db-config').createConnection(dbName);
    var rows = [];

    function getIndisFromList(list, callback) {
        if (! list || list == '') {
            callback();
        }
        else {
            pool.acquire(function(err, conn2) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                var indis = [];
                var sql = `select indi, lname, fname, living,
                        '(' || coalesce(bdate, '_____') || ' - '
                            || coalesce(ddate, '_____') || ')' as dates
                    from indi where indi in (` + list + `)
                    order by upper(lname), upper(fname), bdate `;

                conn2.query(sql, [], function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    results.rows.forEach(function(r) {
                        indis.push({
                            indi: r.INDI,
                            name: r.LNAME + ', ' + r.FNAME,
                            presumed: r.LIVING && ! isLogin,
                            dates: r.dates
                        });
                    });

                    rows[0]['indis'] = indis;

                    pool.release(conn2);

                    callback();
                });
            });
        }
    }

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }

        if (! isNaN(parseInt(id))) {
            var pid = parseInt(id);
            var sql = `select a.id, a.date, a.tdate, a.title, a.desc, a.gid, a.type,
                    '''' || group_concat(indi, ''',''') || '''' as indi_list
                from photos a left join indi_photos b on a.id=b.id
                where a.id=? 
                group by a.id, a.date, a.tdate, a.title, a.desc, a.gid, a.type ` ;

            conn.query(sql, [pid], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                // we have nothing to render id was not found
                if (!results || results.rowCount == 0) {
                    pool.release(conn);
                    pool.close();
                    res.sendStatus(404);
                    return;
                }

                var r = results.rows[0];

                if (r) {
                    var orig;
                    if (fileext[r.type]) {
                        orig = '/' + dbName + '/image/orig/' + String(r.id).padStart(4,'0') +
                            fileext[r.type];
                    }
                    rows.push({
                        id: r.id,
                        date: r.date,
                        tdate: r.tdate,
                        title: r.title,
                        thumb: '/' + dbName + '/image/thumb/' +
                            String(r.id).padStart(4,'0') + '.jpg',
                        web: '/' + dbName + '/image/web/' +
                            String(r.id).padStart(4,'0') + '.jpg',
                        view: '/' + dbName + '/media/view/' + r.id,
                        orig: orig,
                        desc: r.desc,
                        gid: r.gid,
                        type: r.type,
                        indis: []
                    });
                    pool.release(conn);

                    getIndisFromList(r.indi_list, function() {
                        res.locals['photo'] = rows[0];
                        res.locals['prev_id'] = Math.max(pid - 1, 1);
                        res.locals['id'] = pid;
                        res.locals['next_id'] = pid + 1;
                        res.locals['pgroups'] = req.app.locals.pgroups;

                        pool.close();

                        //console.log(JSON.stringify(res.locals, null, 2));
                        if (req.originalUrl.match(/\/view\//)) {
                            res.render('mediaview');
                        }
                        else {
                            res.render('mediaedit');
                        }
                    });
                }
                else {
                    pool.release(conn);
                    pool.close();
                    res.sendStatus(404);
                }
            });
        }
        else {
            res.sendStatus(404);
        }
    });
}

module.exports = mediaEditRouter;

