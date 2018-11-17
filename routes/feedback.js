
var getHeaderInfo = require('../utils');

/* GET feedback. */
function feedbackRouter(req, res, next) {
    var headerInfo = getHeaderInfo(req);
    res.render('feedback', headerInfo);
};

module.exports = feedbackRouter;

