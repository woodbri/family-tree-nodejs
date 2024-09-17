import createError from 'http-errors';
import createConnection from '../dn-config.js';

function mediaLinkRouter(req, res, next) {

    // if req.query.add
    //      'insert or ignore into indi_photos (indi, id) values(?,?)',
    //      [req.query.add, req.params.id]
    //
    // if req.query.del
    //      'delete from indi_photos where indi=? and id=?',
    //      [req.query.del, req.params.id]
    //
    // res.redirect('/dbName/media/edit/' + req.params.id);

    var dbName = req.params.dbName;
    var id = req.params.id;
    var mode, indi, from_id;

    if (req.session && req.session.admin) {

        var sql, params;

        if (req.query && req.query.del) {
            mode = 'del';
            indi = req.query.del;
            sql = 'delete from indi_photos where indi=? and id=?';
            params = [indi, id];
        }
        else if (req.query && req.query.add) {
            mode = 'add';
            indi = req.query.add;
            sql = 'insert or ignore into indi_photos (indi, id) values(?,?)';
            params = [indi, id];
        }
        else if (req.query && (req.query.cpy || req.query.cpy === '')) {
            if (isNaN(parseInt(req.query.cpy))) {
                console.log('cpy redirect');
                res.redirect('/' + dbName + '/media/edit/' + id);
                return;
            }
            mode = 'cpy';
            from_id = req.query.cpy;
            sql = 'insert or ignore into indi_photos select indi, ? as id from indi_photos where id=?';
            params = [id, from_id];
        }
        else {
            next(createError('Invalid operation!'));
            return;
        }

        if (isNaN(parseInt(id)) || (mode != 'cpy' && ! indi.match(/^I\d+$/))) {
            next(createError("parameter(s) are not valid!"));
            return;
        }

        var pool = createConnection(dbName);
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                pool.close()
                res.redirect('/' + dbName + '/media/edit/' + id);
            }

            conn.query('PRAGMA foreign_keys=ON', [], function(err, results) {
                conn.query(sql, params, function(err, results) {
                    if (err) {
                        console.error(err);
                    }
                    pool.release(conn);
                    pool.close()
                    res.redirect('/' + dbName + '/media/edit/' + id);
                });
            });
        });
    }
    else {
        res.redirect('/' + dbName + '/media/edit/' + id);
    }
}

