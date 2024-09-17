
import json2csv from 'json2csv';
import createConnection from '../db-config.js';
import getHeaderInfo from '../utils.js';

/* GET Birthday listing. */
export default function birthdayRouter(req, res, next) {

    var resData = getHeaderInfo(req);
    var dbName = req.params.dbName;
    var pool = createConnection(dbName);

    var rows = [];

    var year = typeof req.query.year === 'undefined' ? 'living' : req.query.year.toLowerCase();
    var day = req.query.day;

    var sql;
    if (typeof req.query.married === 'undefined') {
        sql = `select a.indi, lname || ', ' || fname as name, a.bdate, a.living from indi a where `;
    }
    else {
        sql = `select a.indi, case when d.lname is not null then d.lname || ', ' || a.fname || ' ' || a.lname 
                else a.lname || ', ' || a.fname end as name, a.bdate, a.living
            from indi a left join fams b on a.indi=b.indi and b.seq=(select max(x.seq) from fams x where x.indi=a.indi)
                left join fami c on b.fami=c.fami
                left join indi d on d.indi=case when a.indi=c.husb then null else c.husb end where `;
    }
    if (year == 'all') {
        sql += 'true ';
    }
    else if (year.match(/^\d+$/)) {
        sql += "cast(a.bdate as int) >= " + year + " ";
    }
    else {
        sql += 'a.living ';
    }

    if (typeof day !== 'undefined' && day.match(/^\d\d-\d\d$/)) {
        sql += "and substr(a.bdate, 6, 5)='" + day + "'";
        resData['day'] = day;
    }

    if (typeof req.query.byname === 'undefined') {
        sql += ' order by substr(a.bdate, 6, 5) asc, a.bdate, name ';
    }
    else {
        sql += ' order by name ';
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
                        name: r.name,
                        date: r.BDATE
                    });
                }
            });

            pool.release(conn);
            if (typeof req.query.csv === 'undefined') {
                resData['rows'] = rows;
                res.locals = resData;
                res.render('birthdays');
            }
            else {
                const fields = ['indi', 'name', 'date'];
                const csv = json2csv.parse(rows, {fields: fields});
                res.setHeader('Content-disposition', 'attachment; filename=birthdays.csv');
                res.set('Content-Type', 'text/csv');
                res.status(200).send(csv);
            }
        });
    });

    pool.close();
};


