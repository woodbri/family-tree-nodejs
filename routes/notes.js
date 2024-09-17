import getHeaderInfo from '../utils.js';
import createConnection from '../db-config.js';
import { encode } from 'html-entities';

/* GET notes or source listing. */
export default function notesRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    var dbName = req.params.dbName;
    var items = req.params.id.split('_');
    var noteId = items[0];
    var indi = items[1];
    var pool = createConnection(dbName);

    pool.acquire(function(err, conn) {
        if (err) console.log(err);

        var notes = [];

        // we need the persons name and this is a cheap way to get it with the notes
        var sql = `select lname || ', ' || fname || '|' || living as TEXT
                from indi where indi=?
            union all
            select * from (select text from notes where note=? order by seq asc) as foo`;

        var re = /(https?:\/\/[-.\/~!@#$%^&*_+-=:";'<>?,.\[\]\w]+)/;
        conn.query(sql, [indi, noteId], function(err, results) {
            if (err) return console.error(err);

            results.rows.forEach(function(r) {
                var str = r.TEXT.replace(re, "<a href=\"$1\" target=\"_new\">$1</a>");
                if (r.TEXT != str) {
                    notes.push(str);
                }
                else {
                    notes.push(encode(r.TEXT));
                }
            });
            pool.release(conn);

            // remove the name from the notes
            var name = notes.shift();
            var tmp = name.split('|');
            if (!parseInt(tmp[1]) || (req.session && req.session.user)) {
                res.locals['notes'] = notes;
                res.locals['indi'] = indi;
                res.locals['name'] = tmp[0];
            }
            else {
                res.locals['notes'] =[];
                res.locals['indi'] = '0';
                res.locals['name'] = 'Presumed Living';
            }
            res.render('notes');
        });
        pool.close();
    });
};


