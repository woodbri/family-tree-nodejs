import getHeaderInfo from '../utils.js';
import nodemailer from 'nodemailer';

async function loadMailerConfig(dbName) {
  const module = await import(`../db/${dbName}/${dbName}.js`);
  const cfg = module.mailer;
  return cfg;
}

export default function feedbackPostRouter(req, res) {
    var dbName = req.params.dbName;
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
        loadMailerConfig(dbName).then(cfg => {

            // use this for mailgun and
            // npm install nodemailer-mailgun-transport
            //
            //import mg from 'nodemailer-mailgun-transport';
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
        });
    }
    catch (e) {
        console.error(e);
    }

    res.redirect(decodeURIComponent(url));
}

