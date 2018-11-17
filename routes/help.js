
var getHeaderInfo = require('../utils');

/* GET Help. */
function helpRouter(req, res, next) {
    var headerInfo = getHeaderInfo(req);
    headerInfo['server'] = req.headers.host;
    res.render('help', headerInfo);
}

module.exports = helpRouter;

