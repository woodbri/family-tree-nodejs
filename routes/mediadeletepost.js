import createConnection from '../db-config.js';
import createError from 'http-errors';
import glob from 'glob';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function mediaDeletePostRouter(req, res, next) {
    console.log(JSON.stringify(req.query, null, 2));
    console.log(JSON.stringify(req.params, null, 2));
    console.log(JSON.stringify(req.body, null, 2));
    console.log(JSON.stringify(req.session, null, 2));

    // rm media/dbName/orig/id.*
    // rm media/dbName/web/id.jpg
    // rm media/dbName/thumb/id.jpg
    // delete from photos where id=?
    // delete from indi_photos where id=?
    // res.redirect('/dbName/media/list/photos/all')

    var dbName = req.params.dbName;
    var id = req.params.id;
    var url = '/' + dbName + '/media/edit/' + id;
    if (isNaN(parseInt(id))) {
        next(createError('Invalid id'));
        return;
    }

    if (req.session && req.session.admin) {
        var next_id = parseInt(id) + 1;
        var url = '/' + dbName + '/media/edit/' + next_id;

        var file = String(id).padStart(4, '0');
        var path = __dirname + '/media/' + dbName + '/orig/' + file + '.*';
        var files = [];
        try {
            files = glob.sync(path);
            files.push(__dirname + '/media/' + dbName + '/web/' + file + '.jpg');
            files.push(__dirname + '/media/' + dbName + '/thumb/' + file + '.jpg');

            console.log(files);

            files.forEach(function (item) {
                try {
                    fs.unlink(item);
                }
                catch (e) {
                    console.error('Failed to unlink file "' + item + '": ' + JSON.stringify(e));
                };
            })
        }
        catch (e) {};

        var pool = createConnection(dbName);
        pool.acquire(function(err, conn) {
            if (err) {
                console.error(err);
                next(err);
            }

            var sql = 'delete from photos where id=?';
            conn.query(sql, [id], function(err, results) {
                if (err) {
                    console.error(err);
                    next(err);
                }

                var sql = 'delete from indi_photos where id=?';
                conn.query(sql, [id], function(err, results) {
                    if (err) {
                        console.error(err);
                        next(err);
                    }

                    pool.release(conn);
                    pool.close()

                    res.redirect(url);
                });
            });
        });
    }
    else {
        res.redirect(url);
    }
}

