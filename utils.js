import databases from './db-config.js';

async function loadDBConfig(dbName) {
  const cfg = await import(`./db/${dbName}/${dbName}.js`);
  return cfg.dbConfig;
}

export default function getHeaderInfo(req) {

    var headerInfo = {
        // expires: ...,
        year: new Date().getFullYear(),
        version: '2.0',
        login: 'login',         // TODO login|logout depending on session
        // current_url: ...,    // need with login/logout to redirect to
        // copyright: '...'     // for the data
        email: 'stephenwoodbridge37 (at) gmail (dot) com'
    };

    var dbname = req.params.dbName;
    var dbinfo, requireLoginForFeedback;

    if (dbname && !dbname.match(/favicon.ico/)) {
        try {
            dbinfo = databases[dbname].params;

            loadDBConfig(dbname).then(cfg => {
                requireLoginForFeedback = cfg.requireLoginForFeedback;
	    });
        }
        catch (e) {
            console.error(e);
        }
    }


    if (typeof dbinfo !== 'undefined') {
        headerInfo['copyright'] = dbinfo.copyright;
        headerInfo['title'] = dbinfo.title;
        headerInfo['owner'] = dbinfo.owner;
        headerInfo['hasPhotos'] = dbinfo.hasPhotos;
    }
    headerInfo['dbName'] = dbname;
    headerInfo['current_url'] = encodeURIComponent(req.originalUrl);
    headerInfo['query'] = req.query;
    headerInfo['user'] = typeof req.session.user === 'undefined' ? null : req.session.user;
    headerInfo['feedbackOK'] = !requireLoginForFeedback || headerInfo['user'];

    if (req.session && req.session.user) {
        headerInfo['login'] = 'logout';
        headerInfo['login2'] = 'Logout';
        headerInfo['isLogin'] = true;
        headerInfo['isAdmin'] = req.session.admin;
    }
    else {
        headerInfo['login'] = 'login';
        headerInfo['login2'] = 'Login';
        headerInfo['isAdmin'] = false;
        headerInfo['isLogin'] = false;
    }

    return headerInfo;
}

