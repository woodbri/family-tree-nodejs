
var getHeaderInfo = require('../utils');
var async = require('async');

/* GET names for surname listing. */

function namesRouter(req, res, next) {

    res.locals = getHeaderInfo(req) || {};
    var dbName = req.params.dbName;
    var pool = require('../db-config').createConnection(dbName);
    var useDB = pool.adapter;

    function getDates(dbName, row, idx) {
        return new Promise(async function(resolve, reject) {
            try {
                var pool2 = await require('../db-config').createConnection(dbName);
                pool2.acquire(function(err, conn) {
                    var sql2 = `select a.indi, 
                            '(' || coalesce(b.date, '_______') || ' - ' || coalesce(c.date, '_______') || ')' as dates
                        from indi a
                        left join (
                                  select e.refid, e.etype, date
                                  from events e inner join eorder o on e.etype=o.etype
                                  where refid=? and eorder between 1 and 10 order by eorder asc limit 1
                                ) b on a.indi=b.refid
                        left join (
                                  select e.refid, e.etype, date
                                  from events e inner join eorder o on e.etype=o.etype
                                  where refid=? and eorder > 90 order by eorder asc limit 1
                                ) c on a.indi=c.refid
                        where indi=?`;

                    conn.query(sql2, [row.INDI, row.INDI, row.INDI], function(err, results2) {
                        if (err) {
                            console.log('Error occurred', err);
                            reject(err);
                        }
                        else {
                            pool.release(conn);
                            resolve({
                                idx: idx,
                                name: row.LNAME + ', ' + row.FNAME,
                                indi: row.INDI,
                                dates: results2.rows[0].dates,
                                presumed: row.LIVING && !(req.session && req.session.user),
                                photos: ''
                            });
                        }
                    });
                });
            }
            catch (err) {
                console.log('Error occurred', err);
                reject(err);
            }
        });
    }

    var rows = [];

    var name = req.params.name;
    var sql = "select indi, lname, fname, living, title, sex from indi where lname=? order by fname";

    var param = [name];
    if (name == '_') {
        sql = "select indi, lname, fname, living, title, sex from indi where lname in ('', '?', 'unknown') or lname is null order by fname";
        param = [];
    }

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }

        conn.query(sql, param, function(err, results) {
            if (err) {
                console.error(err);
                next(err);
            }

            if (results) {
                async.forEachOf(results.rows, async function(r, idx, finish) {
                    // this is an async function so return result or throw err
                    // we have nothing to return as we already placed the results back in rows
                    var rr = await getDates(dbName, r, idx);
                    rows[rr.idx] = rr;
                    return;
                },
                function(err) {
                    if (err) console.error(err);
                    res.locals['rows'] = rows;
                    pool.release(conn);
                    res.render('names');
                });
            }
            else {
                res.locals['rows'] = rows;
                pool.release(conn);
                res.render('names');
            }
        });
        pool.close();
    });
}

module.exports = namesRouter;

