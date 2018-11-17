# family-tree-nodejs

This application is a Node.js webserver that serves family tree information from a GEDCOM loaded into a Sqlite database.
It can be configured to serve multiple separate databases and each database can its own configuration.

## Installation

### Package Dependencies

* any-db
* async
* cookie-parser
* express
* express-handlebars
* express-session
* fs
* http-errors
* metaphone
* morgan
* node-htmlencode
* nodemailer
* nodemailer-mailgun-transport
* path

### Download and Install

```
git clone https://github.com/woodbri/family-tree-nodejs.git
cd family-tree-nodejs
npm install
# once you have it configured as below you can start a local server with
./start
```

## Configuring the Server

The section describes how to load a GEDCOM file and configure the server to use it.
The development and testing has been based on using Sqlite databases are quick and
easy to work with and minimize the configuration dependencies and setup. Most page
requests are served in under 200 ms, but this is obviously based on system performance
and load, so your mileage myay vary.

The system supports multiple databases and each can be configured independently of
the other.

### Loading a GEDCOM File

Databases are stored in ./db/<dbname>/<dbname>.\*. There are typically 3 files here:

* <dbname>.db - the sqlite database
* <dbname>.cfg - database specific configuration information
* <dbname>.about - html about this database that gets displayed as part of the home page for this database

To load a GEDCOM file, run these commands and then edit mygedcom.cfg (see below for details) and mygedcom.about as appropriate for your GEDCOM:

```
bin/load-gedcom < path/to/mygedcom.ged
mkdir -p db/mygedcom
mv test.db db/mygedcom/mygedcom.db
cp sample-db.cfg db/mygedcom/mygedcom.cfg
cp sample-db.about db/mygedcom/mygedcom.about
```

### Configuring Databases in the Server

In the db-config.js file edit the databases section so it has your database(s) defined.
In the example below there are two databases configured 'woodbridge' and
'woodbridge\_record'. Leave the 'adapter' set to 'sqlite3', in the future this might
also allow using 'mysql' and/or 'postgresql' databases. Edit the 'database' variable
to point your database as installed above. And leave "read_only" set to "1" since
we don't need to write to the database.

```
var databases = {
    woodbridge: {
        adapter: 'sqlite3',
        read_only: 1,
        database: 'db/woodbridge/woodbridge.db',
        title: 'Woodbridge Family Tree',
        owner: 'Stephen Woodbridge',
        email: 'stephenwoodbridge37 (at) gmail (dot) com',
        copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered."
    },
    woodbridge_record: {
        adapter: 'sqlite3',
        read_only: 1,
        database: 'db/woodbridge_record/woodbridge_record.db',
        title: 'Woodbridge Family Tree',
        owner: 'Stephen Woodbridge',
        email: 'stephenwoodbridge37 (at) gmail (dot) com',
        copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered."
    }
};
```

Leave the rest of the file alone.

### Configuring Login Users

The software has compute if people are living based on the following rules:

* no birth or death date, then presumed dead
* death date, then dead
* birth but no death and age < 115 years, then presumed living

This is used to hide people in your database that are presumed living unless the user
has logged into the system. Logged in users can see everything.

Users are configured with static logins configured in the db/<dbname>/<dbname>.cfg file
in the database directory. the sample-db.cfg you copied has a default user "test" with a password "test", CHANGE THIS!, in the auth section of that file. The admin flag is
not currently being used but might allow an admin user to make changes in the future.


```
var dbConfig = {
    auth: {
        test: {
            password: 'test',
            admin: false                                                                        }
    },
```

### Setting up email for Feedback

I added basic feedback via email and mad a test using mailgun, but there are other
transports available including talking to an smtp server. Read up on nodemailer for
configuration details. You will likely need to make changes to routes/feedbackpost.js
that handles sending the email.

You can configure mailers in the "mailers" section and then reference that in the code.
the "options" section, sets up the basic email envelope and the dumby options.text is
where the email body text will replace based on the form contents.

You can configure "requireLoginForFeedback" to true or false to only allow logged in
user the ability to send you feedback or to allow all users to send feedback.

```
var dbConfig = {
    auth: {
        ...
    },
    requireLoginForFeedback: false,
    mailer: {
        mailgun: {
            auth: {
                api_key: 'secret',
                domain: 'sandbox.mailgun.org'
            }
        },
        options: {
            from: 'youremail@example.com',
            to: 'youremail@example.com',
            subject: 'Feedback on "mygenealogy" genealogy database',
            text: 'nothing here'
        }
    }
};
```


## File Structure

```
./app.js
./bin/load-gedcom
./bin/www
./db/woodbridge/woodbridge.about
./db/woodbridge/woodbridge.cfg
./db/woodbridge/woodbridge.db
./db/woodbridge_record/woodbridge_record.about
./db/woodbridge_record/woodbridge_record.cfg
./db/woodbridge_record/woodbridge_record.db
./db-config.js
./package.json
./package-lock.json
./public/images/favicon.ico
./public/images/favicon-16x16.png
./public/images/favicon-32x32.png
./public/javascripts/helpers.js
./public/stylesheets/style.css
./README.md
./routes/about.js
./routes/birthdays.js
./routes/descendants.js
./routes/feedback.js
./routes/feedbackpost.js
./routes/help.js
./routes/home.js
./routes/index.js
./routes/indi.js
./routes/names.js
./routes/notes.js
./routes/search.js
./routes/source.js
./routes/surnames.js
./sample-db.about
./sample-db.cfg
./utils.js
./views/about.hbs
./views/birthdays.hbs
./views/descendants.hbs
./views/error.hbs
./views/feedback.hbs
./views/help.hbs
./views/home.hbs
./views/index.hbs
./views/indi.hbs
./views/layouts/layout.hbs
./views/login.hbs
./views/names.hbs
./views/notes.hbs
./views/partials/footer.hbs
./views/partials/header.hbs
./views/search.hbs
./views/source.hbs
./views/surnames.hbs
```

## Some Interesting Queries in SQLite

```
-- list indi record and age for all presumed living people older then 80
select \*, strftime('%Y', 'now') - strftime('%Y', bdate) as age
  from indi
 where living and strftime('%Y', 'now') - strftime('%Y', bdate) > 80
 order by age desc, lname, fname;

```
