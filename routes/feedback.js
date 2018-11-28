
var getHeaderInfo = require('../utils');

/* GET feedback. */
function feedbackRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || [];
    res.render('feedback');
};

module.exports = feedbackRouter;

