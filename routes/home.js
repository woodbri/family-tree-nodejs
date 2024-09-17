import fs from 'fs';
import path from 'path';
import getHeaderInfo from '../utils.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* GET About */
export default function homeRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    var temp = path.join(__dirname, '..', 'db', req.params.dbName, req.params.dbName + '.about');
    fs.readFile(temp, function(err, data) {
        if (err) {
            res.send('Error: database "' + req.params.dbName + '" is not loaded!');
            return;
        }

        res.locals['content'] = data;
        res.render('home');
    });
};

