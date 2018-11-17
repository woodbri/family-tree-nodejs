var htmlEncode = require('node-htmlencode').htmlEncode;
var getHeaderInfo = require('../utils');

/* GET notes or source listing. */
function notesRouter(req, res, next) {
    var resData = getHeaderInfo(req);
    var dbName = req.params.dbName;
    var items = req.params.id.split('_');
    var noteId = items[0];
    var indi = items[1];
    var pool = require('../db-config').createConnection(dbName);

    pool.acquire(function(err, conn) {
        if (err) console.log(err);

        var notes = [];

        // we need the persons name and this is a cheap way to get it with the notes
        var sql = `select lname || ', ' || fname || '|' || living as TEXT
                from indi where indi=?
            union all
            select * from (select text from notes where note=? order by seq asc) as foo`;

        conn.query(sql, [indi, noteId], function(err, results) {
            if (err) return console.error(err);

            results.rows.forEach(function(r) {
                notes.push(htmlEncode(r.TEXT));
            });
            pool.release(conn);

            // remove the name from the notes
            var name = notes.shift();
            var tmp = name.split('|');
            if (!parseInt(tmp[1]) || (req.session && req.session.user)) {
                resData['notes'] = notes;
                resData['indi'] = indi;
                resData['name'] = tmp[0];
            }
            else {
                resData['notes'] =[];
                resData['indi'] = '0';
                resData['name'] = 'Presumed Living';
            }
            res.render('notes', resData);
        });
        pool.close();
    });
};

module.exports = notesRouter;

