
import getHeaderInfo from '../utils.js';

/* GET Help. */
export default function helpRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    res.locals['server'] = req.headers.host;
    res.render('help');
}

