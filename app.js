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
// TODO add photolistRouter and photoRouter

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
// TODO add photolistRouter and photoRouter
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
