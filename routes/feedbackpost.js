function feedbackPostRouter(req, res) {
    var getHeaderInfo = require('../utils');
    var dbName = req.params.dbName;
    var cfg = require('../db/' + dbName + '/' + dbName + '.cfg').mailer;
    var url = typeof req.body.ref === 'undefined' ? '/' + dbName + '/' : req.body.ref;

    try {

        // validate input
        if (req.body.fname == '' || ! req.body.femail.match(/^\w+@\w+(\.\w+)+$/) || req.body.fcomments == '') {
            var resData = getHeaderInfo(req);
            resData['ref'] = req.body.ref;
            resData['fname'] = req.body.fname;
            resData['femail'] = req.body.femail;
            resData['fcomments'] = req.body.fcomments;
            resData['errors'] = 'All fields are required to have valid data';
            res.locals = resData;
            res.render('feedback');
            return;
        }
        const nodemailer = require('nodemailer');

        // use this for mailgun and
        // npm install nodemailer-mailgun-transport
        //
        //const mg = require('nodemailer-mailgun-transport');
        //var transporter = nodemailer.createTransport(mg(cfg.mailgun));

        // use this for gmail
        var transporter = nodemailer.createTransport(cfg.gmail);

        // configure the message to send
        var options = cfg.options;
        options['text'] = 'From: ' + req.body.fname + "\n" +
            'Email: ' + req.body.femail + "\n" +
            req.body.fcomments;

        transporter.sendMail(options, function(err, info) {
            if (err) {
                console.log(err);
            }
            else {
                //console.log('Email sent: ' + JSON.stringify(info));
            }
        });
    }
    catch (e) {
        console.error(e);
    }

    res.redirect(decodeURIComponent(url));
}

module.exports = feedbackPostRouter;
