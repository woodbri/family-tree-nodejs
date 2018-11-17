var getHeaderInfo = require('../utils');

/* GET Surnames listing. */
function surnamesRouter(req, res, next) {

    var resData = getHeaderInfo(req);

    var dbName = req.params.dbName;
    var pool = require('../db-config').createConnection(dbName);
    var useDB = pool.adapter;

    pool.acquire(function(err, conn) {
        if (err) {
            console.error(err);
            next(err);
        }

        var sql = "select coalesce(nullif(nullif(lname, '?'), 'unknown'), '') as name, count(*) as cnt from indi group by name order by upper(name)";

        //  Records like: { LNAME: 'Balsley', cnt: 3 },

        conn.query(sql, function(err, results) {
            if (err) {
                console.error(err);
                next(err);
            }

            var tables = [];
            var lastletter = '';
            var table = {letter: '', rows: []};
            var cells = [];
            var cnt = 0;
            var unknown = 0;
            results.rows.forEach(function(r) {
                //console.log(JSON.stringify(r));
                var name = r.name;
                var safename = encodeURIComponent(r.name);
                var letter = '';
                if (name !== null && name.length > 0) {
                    letter = name.substring(0,1).toUpperCase();
                }
                else {
                    name = '';
                }
                if (letter == '') {
                    unknown = r.cnt;
                    return;
                }
                if (letter != lastletter) {
                    if (cells.length > 0) {
                        table.rows.push(cells);
                    }
                    if (table.rows.length > 0) {
                        tables.push(table);
                        table = {
                            letter: letter,
                            rows: []
                        };
                    }
                    else {
                        table.letter = letter;
                    }
                    cnt = 0;
                    cells = [];
                    lastletter = letter;
                }
                cells.push({safename: safename, name: name, cnt: r.cnt});
                cnt++;
                if (cnt % 5 == 0) {
                    table.rows.push(cells);
                    cnt = 0;
                    cells = [];
                }
                //console.log(JSON.stringify({lastletter:lastletter, cnt: cnt}));
            });
            if (cells.length > 0) {
                table.rows.push(cells);
            }
            if (table.rows.length > 0) {
                tables.push(table);
            }

            //console.log(JSON.stringify(tables, null, 2));

            pool.release(conn);
            resData['tables'] = tables;
            resData['unknown'] = unknown;
            res.render('surnames', resData);
        });
    });

    pool.close();
}

module.exports = surnamesRouter;
