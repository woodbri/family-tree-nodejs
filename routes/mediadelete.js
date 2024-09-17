import getHeaderInfo from '../utils.js';
import { createConnection } from '../db-config.js';

export default function mediaDeleteRouter(req, res) {
    res.locals = getHeaderInfo(req) || {};
    var isAdmin = res.locals.isAdmin;
    var isLogin = res.locals.isLogin;
    var dbName = req.params.dbName;
    var id = req.params.id;
    if (req.query.id && ! isNaN(parseInt(req.query.id))) {
        id = String(req.query.id);
    }
    var pool = createConnection(dbName);
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
                var where = isLogin ? '' : ' and not living ';
                var sql = `select indi, lname, fname, living,
                        '(' || coalesce(bdate, '_____') || ' - '
                            || coalesce(ddate, '_____') || ')' as dates
                    from indi where indi in (` + list + `) ` + where + `
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
                            living: r.LIVING,
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
            var sql = `select a.id, a.date, a.tdate, a.title, a.desc, a.gid,
                    '''' || group_concat(indi, ''',''') || '''' as indi_list
                from photos a left join indi_photos b on a.id=b.id
                where a.id=? 
                group by a.id, a.date, a.tdate, a.title, a.desc, a.gid ` ;

            conn.query(sql, [pid], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                // we have nothing to render id was not found
                if (!results || results.rowCount == 0) {
                    res.status(404).send({error: "'" + id + "' was not found!"});
                }

                var r = results.rows[0];

                rows.push({
                    id: r.id,
                    date: r.date,
                    tdate: r.tdate,
                    title: r.title,
                    thumb: '/' + dbName + '/image/thumb/' +
                        String(r.id).padStart(4,'0') + '.jpg',
                    web: '/' + dbName + '/image/web/' +
                        String(r.id).padStart(4,'0') + '.jpg',
                    desc: r.desc,
                    gid: r.gid,
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
                    res.render('mediadelete');
                });
            });
        }
        else {
            res.sendStatus(404);
        }
    });
}

