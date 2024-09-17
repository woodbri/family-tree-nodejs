
import getHeaderInfo from '../utils.js';

/* GET feedback. */
export default function feedbackRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || [];
    res.render('feedback');
};


