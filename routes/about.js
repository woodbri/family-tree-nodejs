var getHeaderInfo = require('../utils');

/* GET About */
function aboutRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    res.render('about');
};

module.exports = aboutRouter;

