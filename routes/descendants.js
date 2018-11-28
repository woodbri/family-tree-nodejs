
var async = require('async');
var getHeaderInfo = require('../utils');

/* GET descendants listing. */
function descendantsRouter(req, res, next) {

    var dbName = req.params.dbName;
    var indi = req.params.indi;

    function getDates(dbName, indi, idx) {
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

                    conn.query(sql2, [indi, indi, indi], function(err, results2) {
                        if (err) {
                            console.log('Error occurred', err);
                            reject(err);
                        }
                        else {
                            // console.log([idx, results2.rows[0].dates]);
                            pool.release(conn);
                            resolve({
                                idx: idx,
                                text: results2.rows[0].dates
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

    var resData = getHeaderInfo(req);

    // parameters
    //
    // refn=1   - add refn column data after name
    // indi=1   - add indi values after name
    // dates=1  - add dates after name TODO
    // max=20   - maximum number of generations in output

    var addrefn = typeof req.query.refn === 'undefined' ? false : true;
    var addindi = typeof req.query.indi === 'undefined' ? false : true;
    var adddate = typeof req.query.dates === 'undefined' ? false : true;
    var maxGen = typeof req.query.max === 'undefined' || req.query.max == '' ? 20 : parseInt(req.query.max) - 1;
    if (maxGen <= 0) maxGen = 20;
    req.query.max = maxGen;

    var pool = require('../db-config').createConnection(dbName);

    var rows = [];

    function linkName(indi, name) {
        return '<a href="/' + dbName + '/indi/' + indi + '">' + name + '</a>';
    }

    function isLiving(living, text) {
        if (!living || (req.session && req.session.user)) {
            return text;
        }
        return 'Presumed Living';
    }

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }
        var first = {};
        var pageName = '';
        var last = '';
        var text = '';

        // get this indi's name and build its url
        conn.query("select living, fname || ' ' || lname as name from indi where indi=?",
                [indi], function (err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }
                    var living = results.rows[0].LIVING;
                    var name = results.rows[0].name;
                    pageName = linkName(indi, isLiving(living, name));
        });

        // get the list of descendents
        // columns: [level, indi, fams, spouse, seq, cindi, name, sname, cname]
        var sql = `with recursive
    children_of (indi, fams, spouse, seq, cindi) as (
        select s.indi, s.fami as fams, case when s.indi=f.husb then f.wife else f.husb end as spouse,
               c.seq, c.indi as cindi
          from fami f, fams s, child c
         where s.fami=f.fami and s.fami=c.fami
    ),
    children_of_with_names (indi, fams, spouse, seq, cindi, name, sname, cname, refn, srefn, crefn, living, sliving, cliving) as (
        select d.*,
                a.fname || ' ' || a.lname as name,
                b.fname || ' ' || b.lname as sname,
                c.fname || ' ' || c.lname as cname,
                coalesce(a.refn, '') as refn,
                coalesce(b.refn, '') as srefn,
                coalesce(c.refn, '') as crefn,
                a.living as living,
                b.living as sliving,
                c.living as cliving
          from children_of d, indi a, indi b, indi c
         where d.indi=a.indi and d.spouse=b.indi and d.cindi=c.indi
    ),
    descendants (level, indi, fams, spouse, seq, cindi, name, sname, cname, refn, srefn, crefn, living, sliving, cliving) as (
        select 0 as level, c.*
          from children_of_with_names c where c.indi=?
        UNION ALL
        select d.level+1, c.*
          from children_of_with_names c, descendants d
         where c.indi=d.cindi and level < ?
         order by 1 desc
    )
    select * from descendants`;

        conn.query(sql, [indi, maxGen], function(err, results) {
            if (err) {
                console.error(err);
                next(err);
            }

            if (results) {
                rows = results.rows;
                async.forEachOf(results.rows, function(r, idx, finish) {
                    if (adddate) {
                        try {
                            //rows[idx] = r;
                            async.parallel({
                                // NOTE: for async functions just return value or throw error
                                // don't use the callback
                                dates: async function(callback) {
                                    var rr = await getDates(dbName, r.indi, idx);
                                    return rr;
                                },
                                sdates: async function(callback) {
                                    var rr = await getDates(dbName, r.spouse, idx);
                                    return rr;
                                },
                                cdates: async function(callback) {
                                    var rr = await getDates(dbName, r.cindi, idx);
                                    return rr;
                                }
                            },
                            function(err, results) {
                                //console.log(results);
                                for(var k in results) {
                                    if (results[k]) {
                                        rows[results[k].idx][k] = results[k].text;
                                    }
                                }
                                finish(err);
                            });
                        }
                        catch (e) {
                            return finish(e);
                        }
                    }
                    else {
                        finish(null);
                    }
                },
                function(err) {
                    if (err) console.error(err);

                    rows.forEach(function(r) {
                        if (typeof first[r.fams] === 'undefined') {
                            first[r.fams] = 1;
                            if (r.indi != last) {
                                var addons = ' ' + (adddate ? r.dates : '') +
                                                  (addrefn && r.refn ? ' [' + r.refn + ']' : '') +
                                                  (addindi ? ' {' + r.indi + '}' : '');
                                text += '|    '.repeat(r.level) + isLiving(r.living, linkName(r.indi, r.name) + addons) + "\n";
                            }
                            addons = ' ' + (adddate ? r.sdates : '') +
                                          (addrefn && r.srefn ? ' [' + r.srefn + ']' : '') +
                                          (addindi ? ' {' + r.spouse + '}' : '');
                            text += '|    '.repeat(r.level) + 'm. ' + isLiving(r.sliving, linkName(r.spouse, r.sname) + addons) + "\n";
                        }
                        addons = ' ' + (adddate ? r.cdates : '') +
                                      (addrefn && r.crefn ? ' [' + r.crefn + ']' : '') +
                                      (addindi ? ' {' + r.cindi + '}' : '');
                        text += '|    '.repeat(r.level+1) + isLiving(r.cliving, linkName(r.cindi, r.cname) + addons) + "\n";

                        last = r.cindi;
                    });

                    resData['line'] = text;
                    resData['name'] = pageName;
                    res.locals = resData;
                    pool.release(conn);
                    res.render('descendants');
                });
            }
            else {
                resData['line'] = text;
                resData['name'] = pageName;
                res.locals = resData;
                pool.release(conn);
                res.render('descendants');
            }
        });
        pool.close();
    });
}

module.exports = descendantsRouter;

