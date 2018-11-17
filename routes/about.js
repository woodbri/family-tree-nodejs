var getHeaderInfo = require('../utils');

/* GET About */
function aboutRouter(req, res, next) {
    var headerInfo = getHeaderInfo(req);
    res.render('about', headerInfo);
};

module.exports = aboutRouter;

