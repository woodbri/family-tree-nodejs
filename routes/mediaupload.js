
/* Display Upload form */
function mediaUploadRouter(req, res, next) {
    if (req.session && req.session.admin) {
        var getHeaderInfo = require('../utils');
        res.locals = getHeaderInfo(req) || {};
        if (req.query && req.query.indi) {
            res.locals['indi'] = req.query.indi;
        }
        res.locals['pgroups'] = req.app.locals.pgroups;
        res.render('mediaupload');
    }
    else {
        res.redirect('/' + req.params.dbName + '/');
    }
};

module.exports = mediaUploadRouter;

