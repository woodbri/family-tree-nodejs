import createConnection from '../db-config.js';

export default function mediaEditPostRouter(req, res, next) {

    // check if admin
    // validate date
    // update photos set desc=?, date=?, tdate=?, title=?, gid=? where id=?
    // [desc, date, tdate, ptype, pgid, id]
    // res.redirect('/dbName/media/edit/id')

    var dbName = req.params.dbName;
    var id = req.params.id;
    var url = '/' + dbName + '/media/edit/' + id;
    
    if (req.session && req.session.admin) {
        var date = req.body.date;
        if (date == '' || date.match(/(^\d\d\d\d(-\d\d(-\d\d)?)?)?$/)[0]) {
            var pool = createConnection(dbName);

            var sql = 'update photos set desc=?, "date"=?, tdate=?, title=?, gid=? where id=?';

            var params = [
                req.body.desc,
                req.body.date,
                req.body.tdate,
                req.body.title,
                req.body.gid,
                id
            ];

            pool.acquire(function(err, conn) {
                if (err) {
                    console.error(err);
                    next(err);
                    return;
                }

                conn.query(sql, params, function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                        return;
                    }
                    pool.release(conn);
                    pool.close();
                    res.redirect(url);
                });
            });
        }
        else {
            res.redirect(url + '?error=date%20is%20not%20valid!%20(YYYY-MM-DD)');
        }
    }
    else {
        res.redirect('/' + dbName + '/media/edit/' + id);
    }
}

