var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressHbs = require('express-handlebars');

var indexRouter = require('./routes/index');
var homeRouter = require('./routes/home');
var aboutRouter = require('./routes/about');
var helpRouter = require('./routes/help');
var surnamesRouter = require('./routes/surnames');
var namesRouter = require('./routes/names');
var birthdaysRouter = require('./routes/birthdays');
var indiRouter = require('./routes/indi');
var descendantsRouter = require('./routes/descendants');
var notesRouter = require('./routes/notes');
var sourceRouter = require('./routes/source');
var searchRouter = require('./routes/search');
var feedbackRouter = require('./routes/feedback');
var feedbackPostRouter = require('./routes/feedbackpost');
// photo management routers
var mediaUploadRouter = require('./routes/mediaupload');
var mediaUploadPostRouter = require('./routes/mediauploadpost');
var mediaImageRouter = require('./routes/mediaimage');
var mediaListRouter = require('./routes/medialist');
var mediaLinkRouter = require('./routes/medialink');
var mediaEditRouter = require('./routes/mediaedit');
var mediaEditPostRouter = require('./routes/mediaeditpost');
var mediaDeleteRouter = require('./routes/mediadelete');
var mediaDeletePostRouter = require('./routes/mediadeletepost');
var mediaSummaryRouter = require('./routes/mediasummary');
var mediaGroupsPostRouter = require('./routes/mediagroupspost');
var getGroupsRouter = require('./routes/getgroups');

var app = express();
var session = require('express-session');

app.use(session({
    secret: 'web-family-tree-5342aaeb',
    resave: true,
    saveUninitialized: true
}));

// view engine setup
app.engine('.hbs', expressHbs({
    defaultLayout: 'layout',
    extname: '.hbs',
    helpers: require('./public/javascripts/helpers.js').helpers
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
    var getHeaderInfo = require('./utils');
    var resData = getHeaderInfo(req);
    resData['ref'] = req.query.ref;
    res.render('login', resData);
});
app.post('/:dbName/login', function(req, res) {
    var dbName = req.params.dbName;
    var auth = require('./db/' + dbName + '/' + dbName + '.cfg').auth;
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

module.exports = app;
