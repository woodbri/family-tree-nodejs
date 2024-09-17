import databases from '../db-config.js';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function mediaImageRouter(req, res, next) {
    var dbName = req.params.dbName;
    var mode = req.params.mode;
    var file = req.params.file;
    if (! dbName || ! databases[dbName] ||
        ! mode || ! mode.match(/^(orig|web|thumb)$/) ||
        ! file || ! file.match(/\.(jpg|tif|gif|png)$/)) {
        res.sendStatus(404);
    }
    var filename =  './media/' + dbName + '/' + mode + '/' + file;
    fs.access(filename, fs.constants.R_OK, (err) => {
        if (err) {
            console.error(err);
            next(err);
        }
        else {
            res.sendFile(filename, {root: __dirname + '/../'}, (err) => {});
        }
    });
}

