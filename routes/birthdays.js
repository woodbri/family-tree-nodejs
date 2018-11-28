
var getHeaderInfo = require('../utils');

/* GET Birthday listing. */
function birthdayRouter(req, res, next) {

    var resData = getHeaderInfo(req);
    var dbName = req.params.dbName;
    var pool = require('../db-config').createConnection(dbName);
    var useDB = pool.adapter;

    var rows = [];

    var year = typeof req.query.year === 'undefined' ? 'living' : req.query.year.toLowerCase();
    var day = req.query.day;

    var sql = 'select indi, lname, fname, bdate, living from indi where ';
    if (year == 'all') {
        sql += 'true ';
    }
    else if (year.match(/^\d+$/)) {
        sql += "cast(bdate as int) >= " + year + " ";
    }
    else {
        sql += 'living ';
    }

    if (typeof day !== 'undefined' && day.match(/^\d\d-\d\d$/)) {
        sql += "and substr(bdate, 6, 5)='" + day + "'";
        resData['day'] = day;
    }

    if (typeof req.query.byname === 'undefined') {
        sql += ' order by substr(bdate, 6, 5) asc, bdate, lname, fname ';
    }
    else {
        sql += ' order by lname, fname ';
    }

    //console.log(sql);

    var rows = [];

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }

        conn.query(sql, [], function(err, results) {
            if (err) {
                console.error(err);
                pool.release(conn);
                next(err);
            }

            results.rows.forEach(function(r) {
                if (!r.LIVING || (req.session && req.session.user)) {
                    rows.push({
                        indi: r.INDI,
                        name: r.LNAME + ', ' + r.FNAME,
                        date: r.BDATE
                    });
                }
            });

            resData['rows'] = rows;
            res.locals = resData;
            pool.release(conn);
            res.render('birthdays');
        });
    });

    pool.close();
};

module.exports = birthdayRouter;

