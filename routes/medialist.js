function mediaListRouter(req, res, next) {
    var getHeaderInfo = require('../utils');
    res.locals = getHeaderInfo(req) || {};
    var isAdmin = res.locals.isAdmin;
    var isLogin = res.locals.isLogin;
    var dbName = req.params.dbName;
    var mode = req.params.mode.toLowerCase();
    var id = String(req.params.id).toLowerCase();
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

                    if (results && results.rowCount > 0) {
                        results.rows.forEach(function(r) {
                            indis.push({
                                indi: r.INDI,
                                name: r.LNAME + ', ' + r.FNAME,
                                presumed: r.LIVING && ! isLogin,
                                dates: r.dates
                            });
                        });
                    }

                    rows[0].indis = indis;
                    pool.release(conn2);
                });


                callback();
            });
        }
    }

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }

        var page = 'medialist';

        if (mode == 'photos') {
            if (id == 'all' || id == 'unlinked' || id == 'undefined') {
                page = 'medialist1';
                var where = '';
                var params = [];
                if (req.query.pfrom && ! isNaN(parseInt(req.query.pfrom))) {
                    where += 'a.id >= ? ';
                    params.push(req.query.pfrom);
                }
                if (req.query.pto && ! isNaN(parseInt(req.query.pto))) {
                    where += (where.length > 0 ? 'and ' : '');
                    where += 'a.id <= ? ';
                    params.push(req.query.pto);
                }
                if (where.length > 0) {
                    where = 'where ' + where;
                }

                var having = id == 'unlinked' ? ' having indi_cnt = 0 ' : '';

                var sql = `select a.id, tdate, title, a.desc, gid, c.desc as grp, count(b.indi) as indi_cnt
                    from photos a left join indi_photos b on a.id=b.id
                        left join pgroups c on c.id=gid
                    ` + where + `
                    group by a.id, tdate, title, a.desc, gid, grp
                    ` + having + `
                    order by a.date, a.id`;

                conn.query(sql, params, function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    if (results && results.rowCount > 0) {
                        results.rows.forEach(function(r) {
                            rows.push({
                                id: r.id,
                                tdate: r.tdate,
                                title: r.title,
                                thumb: '/' + dbName + '/image/thumb/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                web: '/' + dbName + '/image/web/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                desc: r.desc,
                                gid: r.gid,
                                grp: r.grp,
                                indi_cnt: r.indi_cnt
                            });
                        });
                    }
                    res.locals['rows'] = rows;
                    res.locals['header'] = 'List of ' + (id == 'unlinked' ? 'Unlinked ' : 'All ')
                        + 'Images';

                    pool.release(conn);
                    pool.close();
                    res.render(page);
                });
            }
            else if (! isNaN(parseInt(id))) {
                res.redirect('/' + dbName + '/media/edit/' + id);
            }
            else {
                res.sendStatus(404);
            }
        }
        else if (mode == 'indi') {
            if (id.match(/^i\d+$/)) {
                var ncol = 5;
                if (req.query.ncol && ! isNaN(parseInt(req.query.ncol))) {
                    ncol = parseInt(req.query.ncol);
                }
                var large = false;
                if (req.query.large) {
                    large = true;
                }
                id = id.toUpperCase();
                page = 'medialist3';
                var sql = `select a.indi, lname, fname, living,
                    '(' || coalesce(bdate, '_____') || ' - '
                        || coalesce(ddate, '_____') || ')' as dates,
                    c.id, c.title, c.tdate, c.desc, c.gid
                    from indi a left join indi_photos b on a.indi=b.indi
                        left join photos c on b.id=c.id
                    where a.indi=? 
                    order by c.date`;

                conn.query(sql, [id], function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    var first = true;
                    var cells = [];
                    var cnt = 0;
                    if (results && results.rowCount > 0) {
                        results.rows.forEach(function(r) {
                            if (first) {
                                res.locals['indi'] = {
                                    indi: r.INDI,
                                    name: r.LNAME + ', ' + r.FNAME,
                                    dates: r.dates,
                                    presumed: r.LIVING && ! isLogin
                                };
                                first = false;
                            }
                            cells.push({
                                id: r.id,
                                title: r.title,
                                tdate: r.tdate,
                                thumb: '/' + dbName + '/image/thumb/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                picts: '/' + dbName + '/image/web/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                web: '/' + dbName + '/media/view/' + r.id,
                                desc: r.desc,
                                gid: r.gid
                            });
                            cnt++;
                            if (cnt % ncol == 0) {
                                rows.push(cells);
                                cnt = 0;
                                cells = [];
                            }
                        });
                    }
                    if (cells.length > 0) {
                        rows.push(cells);
                    }

                    res.locals['rows'] = rows;
                    res.locals['addDesc'] = true;
                    res.locals['ncol'] = ncol;
                    res.locals['large'] = large;

                    //console.log(JSON.stringify(res.locals, null, 2));

                    pool.release(conn);
                    pool.close();
                    res.render(page);
                });
            }
            else if (id == 'all' || id == 'undefined') {
                page = 'medialist2';
                var list_ids = typeof req.query.list === 'undefined' ? ", '' " : ", group_concat(b.id, ',') ";
                var sql = `select a.indi, lname, fname, living,
                        '(' || coalesce(bdate, '_____') || ' - '
                            || coalesce(ddate, '_____') || ')' as dates,
                        count(id) as photo_cnt` + list_ids + ` as list
                    from indi a join indi_photos b on a.indi=b.indi
                    group by a.indi, lname, fname, living, dates
                    order by upper(lname), upper(fname) `;

                conn.query(sql, [], function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    if (results && results.rowCount > 0) {
                        results.rows.forEach(function(r) {
                            let list = r.list.split(',').sort((a,b)=>{return parseInt(a)-parseInt(b);}).join(', ');
                            rows.push({
                                indi: r.INDI,
                                name: r.LNAME + ', ' + r.FNAME,
                                presumed: r.LIVING && ! isLogin,
                                dates: r.dates,
                                photo_cnt: r.photo_cnt,
                                photo_list: list
                            });
                        });
                    }
                    res.locals['rows'] = rows;
                    res.locals['header'] = 'Summary of Photos by Individuals';

                    pool.release(conn);
                    pool.close();
                    res.render(page);
                });
            }
            else {
                res.sendStatus(404);
            }
        }
        else if (mode == 'group') {
            if (! isNaN(parseInt(id))) {
                page = 'medialist1';
                var sql = `select a.id, tdate, title, desc, gid, count(b.indi) as indi_cnt
                    from photos a left join indi_photos b on a.id=b.id
                    where gid=?
                    group by a.id, tdate, desc
                    order by date, a.id`;

                conn.query(sql, [id], function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    res.locals['rows'] = [];
                    results.rows.forEach(function(r) {
                        res.locals.rows.push({
                            id: r.id,
                            tdate: r.tdate,
                            title: r.title,
                            thumb: '/' + dbName + '/image/thumb/' +
                                String(r.id).padStart(4,'0') + '.jpg',
                            web: '/' + dbName + '/image/web/' +
                                String(r.id).padStart(4,'0') + '.jpg',
                            desc: r.desc,
                            gid: r.gid,
                            indi_cnt: r.indi_cnt
                        });
                    });

                    sql = 'select desc from pgroups where id=?';
                    conn.query(sql, [id], function (err, results) {
                        if (err) {
                            console.error(err);
                            next(err);
                        }

                        if (results && results.rowCount > 0) {
                            res.locals['header'] = 'Photos from ' + results.rows[0].desc;
                        }
                        else {
                            res.locals['header'] = 'Photos from group ' + id;
                        }

                        pool.release(conn);
                        pool.close();
                        res.render(page);
                    });
                });
            }
            else {
                res.sendStatus(404);
            }
        }
        else if (mode == 'search') {
            page = 'medialist1';
            var sql = `select a.id, tdate, a.title, desc, gid, count(b.indi) as indi_cnt
                from photos a left join indi_photos b on a.id=b.id
                    left join indi c on b.indi=c.indi
                where upper(a.title) like upper(?) or
                    upper(a.desc) like upper(?) or
                    upper(c.lname) like upper(?) or
                    upper(c.fname) like upper(?)
                group by a.id, tdate, a.title, desc, gid
                order by date, a.id`;

            var sstr = req.query.sstr;
            var params = [sstr, sstr, sstr, sstr];

            if (sstr != '') {
                conn.query(sql, params, function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    res.locals['rows'] = [];
                    if (results && results.rowCount > 0) {
                        results.rows.forEach(function(r) {
                            res.locals.rows.push({
                                id: r.id,
                                tdate: r.tdate,
                                title: r.title,
                                thumb: '/' + dbName + '/image/thumb/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                web: '/' + dbName + '/image/web/' +
                                    String(r.id).padStart(4,'0') + '.jpg',
                                desc: r.desc,
                                gid: r.gid,
                                indi_cnt: r.indi_cnt
                            });
                        });
                    }

                    res.locals['header'] = "Photos from Search for '" + sstr + "'";

                    pool.release(conn);
                    pool.close();
                    res.render(page);
                });
            }
            else {
                res.sendStatus(404);
            }
        }
        else {
            res.sendStatus(404);
        }
    });
}

module.exports = mediaListRouter;

