import getHeaderInfo from '../utils.js';

/* GET About */
export default function aboutRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    res.render('about');
};

