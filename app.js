import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import express from 'express';
import handlebars from 'express-handlebars';

import indexRouter from './routes/index.js';
import homeRouter from './routes/home.js';
import aboutRouter from './routes/about.js';
import helpRouter from './routes/help.js';
import surnamesRouter from './routes/surnames.js';
import namesRouter from './routes/names.js';
import birthdaysRouter from './routes/birthdays.js';
import indiRouter from './routes/indi.js';
import descendantsRouter from './routes/descendants.js';
import notesRouter from './routes/notes.js';
import sourceRouter from './routes/source.js';
import searchRouter from './routes/search.js';
import feedbackRouter from './routes/feedback.js';
import feedbackPostRouter from './routes/feedbackpost.js';
// photo management routers
import mediaUploadRouter from './routes/mediaupload.js';
import mediaUploadPostRouter from './routes/mediauploadpost.js';
import mediaImageRouter from './routes/mediaimage.js';
import mediaListRouter from './routes/medialist.js';
import mediaLinkRouter from './routes/medialink.js';
import mediaEditRouter from './routes/mediaedit.js';
import mediaEditPostRouter from './routes/mediaeditpost.js';
import mediaDeleteRouter from './routes/mediadelete.js';
import mediaDeletePostRouter from './routes/mediadeletepost.js';
import mediaSummaryRouter from './routes/mediasummary.js';
import mediaGroupsPostRouter from './routes/mediagroupspost.js';
import getGroupsRouter from './routes/getgroups.js';

import getHeaderInfo from './utils.js';
import session from 'express-session';
import { helpers } from './public/javascripts/helpers.js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

async function loadDBConfig(dbName) {
    const cfg = await import(`./db/${dbName}/${dbName}.js`);
    return cfg.dbConfig;
}

app.use(session({
    secret: 'web-family-tree-5342aaeb',
    resave: true,
    saveUninitialized: true
}));

// view engine setup
app.engine('hbs', handlebars.engine({
    defaultLayout: 'layout',
    extname: 'hbs',
    helpers: helpers
}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/:dbName/image/:mode/:file', mediaImageRouter)
app.use('/:dbName/home', homeRouter);
app.use('/:dbName/about', aboutRouter);
app.use('/:dbName/help', helpRouter);
app.use('/:dbName/surnames', surnamesRouter);
app.use('/:dbName/names/:name/', namesRouter);
app.use('/:dbName/birthdays', birthdaysRouter);
app.use('/:dbName/indi/:indi', indiRouter);
app.use('/:dbName/descendants/:indi', descendantsRouter);
app.use('/:dbName/notes/:id', notesRouter);
app.use('/:dbName/source/:id', sourceRouter);
app.use('/:dbName/search', searchRouter);
app.get('/:dbName/feedback', feedbackRouter);
app.post('/:dbName/feedback', feedbackPostRouter);
// photo management routes
app.get('/:dbName/media/upload', getGroupsRouter, mediaUploadRouter);
app.post('/:dbName/media/upload', mediaUploadPostRouter);
app.use('/:dbName/media/list/:mode/:id*?', mediaListRouter);
app.use('/:dbName/media/link/:id', mediaLinkRouter);
app.get('/:dbName/media/edit/:id', getGroupsRouter, mediaEditRouter);
app.get('/:dbName/media/view/:id', getGroupsRouter, mediaEditRouter);
app.post('/:dbName/media/edit/:id', mediaEditPostRouter);
app.get('/:dbName/media/delete/:id', getGroupsRouter, mediaDeleteRouter);
app.post('/:dbName/media/delete/:id', mediaDeletePostRouter);
app.get('/:dbName/media/summary', mediaSummaryRouter);
app.post('/:dbName/media/groups', mediaGroupsPostRouter, getGroupsRouter);

app.get('/:dbName/login', function(req, res) {
    var resData = getHeaderInfo(req);
    resData['ref'] = req.query.ref;
    res.render('login', resData);
});
app.post('/:dbName/login', function(req, res) {
    var dbName = req.params.dbName;
    loadDBConfig(dbName).then(cfg => {
        var auth = cfg.auth;
        try {
            var url = typeof req.body.ref === 'undefined' ? '/' + req.params.dbName + '/' : req.body.ref;
            if (!req.body.username || !req.body.password) {
                res.redirect(decodeURIComponent(url));
            }
            else if (auth[req.body.username].password === req.body.password) {
                req.session.user = req.body.username;
                req.session.admin = auth[req.body.username].admin;
                res.redirect(decodeURIComponent(url));
            }
        }
        catch (e) {
            console.error(e);
            res.redirect('/' + req.params.dbName);
        }
    });
});
app.use('/:dbName/logout', function(req, res) {
    req.session.destroy();
    var url = typeof req.query.ref === 'undefined' ? '/' + req.params.dbName + '/' : req.query.ref;
    res.redirect(decodeURIComponent(url));
});
app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/:dbName/', homeRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
