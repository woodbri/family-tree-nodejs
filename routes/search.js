var htmlEncode = require('node-htmlencode').htmlEncode;
var getHeaderInfo = require('../utils');

/* GET Search Form. */
function searchRouter(req, res, next) {

    // set some defaults
    if (typeof req.query === 'undefined' || Object.keys(req.query).length == 0) {
        req['query'] = {
            stype: 1,
            'case': 1,
            inNames: 1
        };
    }

    var resData = getHeaderInfo(req);
    var async = require('async');
    var dbName = req.params.dbName;
    var pool = require('../db-config').createConnection(dbName);

    /*
     * req.query.string     - the search string
     * req.query.stype      - 0: exact, 1: contains, 2: fuzzy last name
     * req.query.case       - ignore case
     * req.query.inNames
     * req.query.inPlaces
     * req.query.inDates
     * req.query.inNotes
     * req.query.inSources
     */

     //   ** results data **

     var data = {
            names: [],
            places: [],
            dates: [],
            notes: [],
            sources: []
        };

    var funcs = [];

    if (req.query.inNames) funcs.push(inNames);
    if (req.query.inPlaces) funcs.push(inPlaces);
    if (req.query.inDates) funcs.push(inDates);
    if (req.query.inNotes) funcs.push(inNotes);
    if (req.query.inSources) funcs.push(inSources);

    if (funcs.length > 0) {
        async.parallel(funcs, function(err, values) {
            pool.close();
            resData['results'] = data;
            res.render('search', resData);
        });
    }
    else {
        pool.close();
        resData['results'] = data;
        res.render('search', resData);
    }

    function linkName(r) {
        return '<a href="/' + dbName + '/indi/' + r.INDI + '">' + r.LNAME + ', ' + r.FNAME + '</a>';
    }

    function inNames(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql;
            var params = [];
            switch (req.query.stype) {
                case '1':   // contains
                    sql = 'select indi, lname, fname, living from indi where ';
                    if (req.query.case) {
                        sql += "upper(lname) like upper(?) or upper(fname) like upper(?) order by upper(lname), upper(fname)";
                    }
                    else {
                        sql += 'lname like ? or fname like ? order by upper(lname), upper(fname)';
                    }
                    params = ['%' + req.query.string + '%', '%' + req.query.string + '%'];
                    break;
                case '2':   // fuzzy last name
                    var metaphone = require('metaphone');
                    params = [metaphone(req.query.string).substring(0,4)];
                    sql = 'select indi, lname, fname, living from indi where lname_mp = ? order by upper(lname), upper(fname)';
                    break;
                default:    // exact
                    sql = 'select indi, lname, fname, living from indi where ';
                    if (req.query.case) {
                        sql += "upper(lname) = upper(?) or upper(fname) = upper(?) order by upper(lname), upper(fname)";
                    }
                    else {
                        sql += 'lname = ? or fname = ? order by upper(lname), upper(fname)';
                    }
                    params = [req.query.string, req.query.string];
                    break;
            }

            conn.query(sql, params, function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                results.rows.forEach(function(r) {
                    if (!r.LIVING || (req.session && req.session.user)) {
                        data.names.push(linkName(r));
                    }
                });
                pool.release(conn);
                next(null, 'inNames');
            });
        });
    }

    function inPlaces(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var string = req.query.string;
            var where;

            if (req.query.stype == '1') {
                if (req.query.case) {
                    where = 'upper(plac) like upper(?) ';
                }
                else {
                    where = 'plac like ? ';
                }
                string = '%' + string + '%';
            }
            else {
                if (req.query.case) {
                    where = 'upper(plac) = upper(?) ';
                }
                else {
                    where = 'plac = ? ';
                }
            }

            var sql = `select indi, lname, fname, living, etype, date, plac,
                    upper(lname) as ulname, upper(fname) as ufname
                from events e, indi i where e.refid=i.indi and ` + where + `
                UNION ALL
                select indi, lname, fname, living, etype, date, plac,
                    upper(lname) as ulname, upper(fname) as ufname
                from events e, fami f, indi i
                where e.refid=f.fami and i.indi in (f.husb, f.wife) and ` +
                where + ' order by ulname, ufname ';

            conn.query(sql, [string, string], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                results.rows.forEach(function(r) {
                    if (!r.LIVING || (req.session && req.session.user)) {
                        data.places.push(
                            linkName(r) + ' - ' + r.ETYPE + ': ' +
                                r.DATE + ' : ' + r.PLAC
                        );
                    }
                });
                pool.release(conn);
                next(null, 'inPlaces');
            });
        });
    }

    function inDates(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var string = req.query.string;
            var where;

            if (req.query.stype == '1') {
                if (req.query.case) {
                    where = 'upper(date) like upper(?) ';
                }
                else {
                    where = 'date like ? ';
                }
                string = '%' + string + '%';
            }
            else {
                if (req.query.case) {
                    where = 'upper(date) = upper(?) ';
                }
                else {
                    where = 'date = ? ';
                }
            }

            var sql = `select indi, lname, fname, living, etype, date, plac, 
                    upper(lname) as ulname, upper(fname) as ufname
                from events e, indi i where e.refid=i.indi and ` + where + `
                UNION ALL
                select indi, lname, fname, living, etype, date, plac,
                    upper(lname) as ulname, upper(fname) as ufname
                from events e, fami f, indi i
                where e.refid=f.fami and i.indi in (f.husb, f.wife) and ` +
                where + ' order by ulname, ufname ';

            conn.query(sql, [], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                results.rows.forEach(function(r) {
                    if (!r.LIVING || (req.session && req.session.user)) {
                        data.places.push(
                            linkName(r) + ' - ' + r.ETYPE + ': ' + r.DATE +
                                ' : ' + r.PLAC
                        );
                    }
                });
                pool.release(conn);
                next(null, 'inDates');
            });
        });
    }

    function inNotes(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var string = req.query.string;
            var where;

            if (req.query.case) {
                where = 'upper(text) like upper(?) ';
            }
            else {
                where = 'text like ? ';
            }
            string = '%' + string + '%';

            var sql = `select distinct indi, lname, fname, living, i.note, 
                    upper(lname) as ulname, upper(fname) as ufname
                from indi i, notes n where i.note=n.note and ` + where + `
                UNION ALL
                select distinct indi, lname, fname, living, f.note,
                    upper(lname) as ulname, upper(fname) as ufname
                from fami f, notes n, indi i
                where f.note=n.note and i.indi in (f.husb, f.wife) and ` +
                where + ' order by ulname, ufname ';

            conn.query(sql, [string, string], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                results.rows.forEach(function(r) {
                    if (!r.LIVING || (req.session && req.session.user)) {
                        data.notes.push(
                            linkName(r) +
                            ' - <a href="/' + dbName + '/notes/' + r.NOTE +
                                '_' + r.INDI + '">NOTES</a>'
                        );
                    }
                });
                pool.release(conn);
                next(null, 'inNotes');
            });
        });
    }

    function inSources(next) {
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var string = req.query.string;
            var where;

            if (req.query.case) {
                where = `( upper(a.text) like upper(?)
                    or upper(b.titl) like upper(?) 
                    or upper(b.auth) like upper(?)
                    or upper(b.publ) like upper(?)
                    or upper(b.repo) like upper(?) ) `;
            }
            else {
                where = `( a.text like ? 
                    or b.titl like ?
                    or b.auth like ?
                    or b.publ like ?
                    or b.repo like ? ) `;
            }
            var s = '%' + string + '%';

            var sql = `select distinct indi, lname, fname, living, a.text, a.seq, b.*,
                    upper(lname) as ulname, upper(fname) as ufname
                from sourtxt a, sour b, indi i
                where a.sourid=b.sour and a.refid=i.indi and ` + where + `
                UNION ALL
                select distinct indi, lname, fname, living, a.text, a.seq, b.*,
                    upper(lname) as ulname, upper(fname) as ufname
                from sourtxt a, sour b, fami f, indi i
                where a.refid=f.fami and a.sourid=b.sour and
                    i.indi in (f.husb, f.wife) and ` + where +
                ' order by ulname, ufname ';

            //console.log(sql);

            conn.query(sql, [s,s,s,s,s,s,s,s,s,s], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                results.rows.forEach(function(r) {
                    if (!r.LIVING || (req.session && req.session.user)) {
                        var aa = [r.TITL, r.AUTH, r.PUBL, r.REPO].join('; ');
                        data.sources.push(
                            linkName(r) + ' - <a href="/' + dbName + '/source/' +
                                r.SEQ + '">' + htmlEncode(r.TEXT) + '</a> - ' +
                                htmlEncode(aa)
                        );
                    }
                });
                pool.release(conn);
                next(null, 'inSources');
            });
        });
    }
};

module.exports = searchRouter;

