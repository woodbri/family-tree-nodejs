
var getHeaderInfo = require('../utils');

/* GET Help. */
function helpRouter(req, res, next) {
    res.locals = getHeaderInfo(req) || {};
    res.locals['server'] = req.headers.host;
    res.render('help');
}

module.exports = helpRouter;

