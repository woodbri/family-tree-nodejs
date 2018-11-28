
const fileext = {
    jpeg: '.jpg',
    png: '.png',
    webp: '.webp',
    tiff: '.tif',
    gif: '.gif',
    svg: '.svg'
};

var getHeaderInfo = require('../utils');

function mediaUploadPostRouter(req, res, next) {

    var dbName = req.params.dbName;
    res.locals = getHeaderInfo(req) || {};
    var date, title, desc, indilist = '';

    function errorHandler(err, page) {
        console.error(err);
        res.locals['error'] = JSON.stringify(err, null, 2);
        res.render(page);
    }

    if (req.session && req.session.admin) {
        var oldpath;
        var formidable = require('formidable');
        var fs = require('fs');
        var sharp = require('sharp');
        var form = new formidable.IncomingForm();
        var newid = '';
        var error = '';

        form.parse(req, function(err, fields, files) {
            if (err) {
                console.error(err);
                next(err);
            }

            if (typeof files === 'undefined' ||
                    typeof files.uploadfile === 'undefined' ||
                    typeof files.uploadfile.path === 'undefined') {
                error = 'Upload failed: make sure you specified a file!';
                errorHandler(error, 'mediaupload');
                return;
            }
            else if (fields.date != '' && ! fields.date.match(/^\d{4}(-\d{2}(-\d{2})?)?$/)) {
                error = 'Invalid date format (YYYY[-MM[-DD]]) ie: MM and/or DD are optional';
                errorHandler(error, 'mediaupload');
                return;
            }

            date = fields.date;
            tdate = fields.tdate;
            title = fields.title;
            desc = fields.desc;
            indilist = fields.indilist;
        });

        if (error) return;

        function fcheck(path, where) {
            fs.access(path, fs.constants.F_OK | fs.constants.W_OK, (err) => {
                if (err) console.error([where, err]);
                else console.log('OK at ' + where);
            });
        }

        form.on('end', function() {
            oldpath = this.openedFiles[0].path;
            const image = sharp(oldpath);
            var ext;
            image.metadata().then(function(info) {
                ext = fileext[info.format];
                if (!ext) {
                    if (oldpath) fs.unlink(oldpath, function(err) {});
                    errorHandler('Upload failed: Unsupported type of media!', 'mediaupload');
                    return;
                }
                var pool = require('../db-config').createConnection(dbName);
                pool.acquire(function(err, conn) {
                    if (err) {
                        pool.close();
                        if (oldpath) fs.unlink(oldpath, function(err) {});
                        errorHandler(err, 'mediaupload');
                        return;
                    }
                    var sql = "insert into images (type, title, date, desc) values(?,?,?,?)";
                    var params = [info.format, title.substr(0,50), date, desc.substr(0,1024)];
                    conn.query(sql, params, function(err, results) {
                        if (err) {
                            pool.release(conn);
                            pool.close();
                            if (oldpath) fs.unlink(oldpath, function(err) {});
                            errorHandler(err, 'mediaupload');
                            return;
                        }
                        var lastId = results.lastInsertId;
                        newid = String(lastId).padStart(4, '0');

                        var indis = indilist.split(/[\s,]+/);
                        indis.forEach(function(item) {
                            var sql = 'insert into imageindi values (?,?)';
                            conn.query(sql, [lastId, item]);
                        });

                        pool.release(conn);
                        pool.close();

                        // make the directories if they don't exist
                        fs.mkdirSync('./media/' + dbName + '/orig/', { recursive: true }, (err) => {});
                        fs.mkdirSync('./media/' + dbName + '/web/', { recursive: true }, (err) => {});
                        fs.mkdirSync('./media/' + dbName + '/thumb/', { recursive: true }, (err) => {});

                        var newpath = './media/' + dbName + '/orig/' + newid + ext;
                        fs.rename(oldpath, newpath, function(err) {
                            if (err) {
                                pool.release(conn);
                                pool.close();
                                if (oldpath) fs.unlink(oldpath, function(err) {});
                                errorHandler(err, 'mediaupload');
                                return;
                            }
                            console.log('File: "' + newpath + '" uploaded');

                            // TODO resize can copy to web and thumb dirs

                            const pipeline = sharp(newpath);
                            pipeline.clone()
                                .resize(440, 440,
                                        { fit: sharp.fit.inside,
                                          withoutEnlargement: true })
                                .toFormat('jpeg')
                                .toFile('./media/' + dbName + '/web/' + newid + '.jpg');
                            pipeline.clone()
                                .resize(75, 75,
                                        { fit: sharp.fit.inside,
                                          withoutEnlargement: true })
                                .toFormat('jpeg')
                                .toFile('./media/' + dbName + '/thumb/' + newid + '.jpg');

                            // force sharp to close files
                            sharp.cache(false);

                            if (newid != '') {
                                res.redirect('/' + dbName + '/media/edit/' + newid);
                            }
                            else {
                                errorHandler('Something went wrong with the upload, see if the file is in the list.', 'medialist');
                                return;
                            }
                        });
                    });
                });
            });
        });
    }
    else {
        res.redirect('/' + req.params.dbName + '/');
    }
}

module.exports = mediaUploadPostRouter;
