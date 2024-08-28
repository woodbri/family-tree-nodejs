# family-tree-nodejs

This application is a Node.js webserver that serves family tree information from a GEDCOM loaded into a Sqlite database.
It can be configured to serve multiple separate databases and each database can its own configuration.

Performance is generally very good, 100-200 ms on most requests with the exception of the descendants listing that can take several minutes for a large number of descendants due to the fact that the query is recursive and needs to collect all the children of all families down through all generations from the selected individual. For example in my database, six generations and about 150 individuals in the list took about 3 seconds using a sqlite database.

This was built to work with my GEDCOM files and it might need changes and/or additions to work with other GEDCOM files. I use Family Tree Maker as my master repository then export that to GEDCOM files to load into this application.

Collaboration and/or pull requests are welcome.

## ISSUES

The loading of NOTE and probably SOUR ged records needs to be reviewed, for how they are loaded and dumped. I'm see records like:

```
0 @NS247761@ NOTE The original ownership of this Bible is uncertain.  The earliest handwriting does not match that of Christoph Friederich Klett (Frederick, Sr.), and has yet to be identified.  Several entries are in t
1 CONC he same hand, which suggests that the events were recorded all at once and not as they happened.  Other events in varying handwriting styles appear to have been entered at different times, whether the
1 CONC se records were entered at the time of the event or later has not been established with any certainty.

0 @S24776@ SOUR
1 ABBR Klett Family Bible
1 TITL <i>Klett Family Bible</i>
1 _SUBQ <i>Klett Family Bible</i>
1 _BIBL <i>Klett Family Bible</i>.
1 NOTE The original ownership of this Bible is uncertain.  The earliest handwr
2 CONC iting does not match that of Christoph Friederich Klett (Frederick, Sr.
2 CONC ), and has yet to be identified.  Several entries are in the same hand, w
2 CONC hich suggests that the events were recorded all at once and not as they h
2 CONC appened.  Other events in varying handwriting styles appear to have bee
2 CONC n entered at different times, whether these records were entered at the t
2 CONC ime of the event or later has not been established with any certainty.
```

Also RootsMagic puts a LOT of tags that are not in the original Family Tree Maker GED files that were used when this was originally written, so some additional thought needs to go into handling them.


## Installation

### Package Dependencies

See the package.json file for up to date list and versions.

* any-db
* any-db-pool
* any-db-sqlite3
* async
* cookie-parser
* debug
* express
* express-handlebars
* express-session
* formidable
* glob-fs
* fs
* hbs
* http-errors
* metaphone
* morgan
* node-htmlencode
* nodemailer
* path
* sharp

### Download and Install

```
git clone https://github.com/woodbri/family-tree-nodejs.git
cd family-tree-nodejs
npm install
# once you have it configured as below you can start a local server with
./start
```

### Running with Docker

Alternatively, a `docker-compose.yml` file is provided which will install and
run the app inside a Docker container, accessible at `http://localhost:3000`.

You will need to have Docker and Docker Compose installed to use this method.

To run in Docker, use the following command:

```
sudo docker-compose up
```

This will create a `db` folder that is mounted into the container. Follow the
configuration instructions below and put your database and configuration in
that folder.

## Configuring the Server

The section describes how to load a GEDCOM file and configure the server to use it.
The development and testing has been based on using Sqlite databases that are quick and
easy to work with and minimize the configuration dependencies and setup. Most page
requests are served in under 200 ms, but this is obviously based on system performance
and load, so your mileage may vary.

The system supports multiple databases and each can be configured independently of
the other.

### Loading a GEDCOM File

Databases are stored in ./db/&lt;dbname&gt;/&lt;dbname&gt;.\*. There are typically 3 files here:

* &lt;dbname&gt;.db - the sqlite database
* &lt;dbname&gt;.cfg - database specific configuration information
* &lt;dbname&gt;.about - html about this database that gets displayed as part of the home page for this database

To load a GEDCOM file, run these commands and then edit mygedcom.cfg (see below for details) and mygedcom.about as appropriate for your GEDCOM:

```
bin/load-gedcom < path/to/mygedcom.ged
bin/build-graphdb
mkdir -p db/mygedcom
mv test.db db/mygedcom/mygedcom.db
mv graphdb.json db/mygedcom/mygedcom.json
cp sample-db.cfg db/mygedcom/mygedcom.cfg
cp sample-db.about db/mygedcom/mygedcom.about
```

### Updating your database with photo tables

Since all the info about photos and links to individuals is stored in the database, you need
to make sure you don't delete or loose it. This process deals with update your database
with an updated GEDCOM when you have photos linked to the GEDCOM file.

    NOTE: because we link photos to the unique Ixxxx assigned each individual in the GEDCOM
    file it is CRITICAL that your DO NOT renumber the individuals in your genealogy program
    or it will MESS UP you linkages!!!!

```
cp db/<dbname>/<dbname>.db test.db
bin/load-gedcom < path/to/mygedcom.ged
bin/build-graphdb
mv test.db db/<dbname>/<dbname>.db
mv graphdb.json db/<dbname>/<dbname>.json
```

The first command copies your existing database with the photo tables in it. Then the next command
drops the genealogy tables only leaving the photos in place and reloads the genealogy tables
from the GEDCOM. The last two command moves the updated test.db back into place and you should
have both the new genealogy data and you existing photo tables and moves the new graph database
in place.

### Integrating Photos with your Genealogy Data

This code currently does not support GEDCOM 5.5 support for media links. This could be
added in the future. For now there is a photo management system included if you turn it on
in ``db-config.js`` by setting ``hasPhotos: true``. This enable a ``Photos`` link on the
main menu bar. From here your users logged in with admin rights can upload photos, link
them to individuals, view them and edit attributes associated with the photos.

### Configuring Databases in the Server

In the db-config.js file edit the databases section so it has your database(s) defined.
In the example below there are two databases configured 'woodbridge' and
'woodbridge\_record'. Leave the 'adapter' set to 'sqlite3', in the future this might
also allow using 'mysql' and/or 'postgresql' databases. Edit the 'database' variable
to point your database as installed above.

Version 0.1.0+ has support for integrating photos with you genealogy. If you use this
DO NOT renumber your indiviual ID in your genealogy program as these are used to link
to photos. In the ``db-config.js`` file set option ``hasPhotos: true`` if you plan to
use the photo management option or ``hasPhotos: false`` if not.

```
var databases = {
    woodbridge: {
        adapter: 'sqlite3',
        read_only: 1,
        database: 'db/woodbridge/woodbridge.db',
        title: 'Woodbridge Family Tree',
        owner: 'Stephen Woodbridge',
        email: 'stephenwoodbridge37 (at) gmail (dot) com',
        copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered.",
        hasPhotos: true
    },
    woodbridge_record: {
        adapter: 'sqlite3',
        read_only: 1,
        database: 'db/woodbridge_record/woodbridge_record.db',
        title: 'Woodbridge Family Tree',
        owner: 'Stephen Woodbridge',
        email: 'stephenwoodbridge37 (at) gmail (dot) com',
        copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered.",
        hasPhotos false
    }
};
```

Leave the rest of the file alone.

### Configuring Login Users

The software will compute if people are living based on the following rules:

* no birth and no death date, then presumed dead
* death date, then dead
* birth but no death and age < 115 years, then presumed living

This is used to hide people in your database that are presumed living unless the user
has logged into the system. Logged in users can see everything.

Users are configured with static logins configured in the db/&lt;dbname&gt;/&lt;dbname&gt;.cfg file
in the database directory. the sample-db.cfg you copied has a default user "test" with a password "test", CHANGE THIS!, in the auth section of that file. The admin flag is
required if you want to allow this user to upload, edit and manage photos associated with
your family tree.


```
var dbConfig = {
    auth: {
        test: {
            password: 'test',
            admin: false                                                                        }
    },
```

### Setting up email for Feedback

I added basic feedback via email and made a test using mailgun, but there are other
transports available including talking to an smtp server. Read up on nodemailer for
configuration details. You will likely need to make changes to routes/feedbackpost.js
that handles sending the email.

You can configure mailers in the "mailers" section and then reference that in the code.
the "options" section, sets up the basic email envelope and the dummy options.text is
where the email body text will replace based on the form contents.

You can configure "requireLoginForFeedback" to true or false to only allow logged in
users the ability to send you feedback or to allow all users to send feedback.

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

### Using find-relationship

Find-relationship searches the graph database version of your gedcom file to find a path
from one individual to another. The command runs like:

```
Usage: find-relationship database indi_from indi_to
```

as in this example:

```
$ bin/find-relationship woodbridge I0169 I2825
find-relationship:  { iter: 5619,
  distance: 12,
  path:
   [ { indi: 'I0169', name: 'Stephen Eliot Woodbridge' },
     { indi: 'I2788', name: 'Joseph Eliot Woodbridge' },
     { indi: 'I3365', name: 'Donald Eliot Woodbridge' },
     { indi: 'I0002', name: 'Joseph Lester Woodbridge' },
     { indi: 'I1857', name: 'Irene Augusta Cartwright' },
     { indi: 'I2792', name: 'David Gardner Cartwright' },
     { indi: 'I2796', name: 'Thomas Cartwright' },
     { indi: 'I2798', name: 'Benjamin Cartwright' },
     { indi: 'I2801', name: 'Hezadiah Cartwright' },
     { indi: 'I2816', name: 'Bethia Pratt' },
     { indi: 'I2819', name: 'Joseph Pratt' },
     { indi: 'I2823', name: 'Mary Priest' },
     { indi: 'I2825', name: 'Degory Priest' } ] }
```

## File Structure

The sqlite databases are stored in ``./db/&lt;DBName&gt;/`` along with its cfg and about
files. If you are using the Photo management options the photos are stored in
``./media/&lt;DBName&gt;/`` and photo attributes are stored in the respective database.

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
./LICENSE
./media/README.md
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
./routes/getgroups.js
./routes/help.js
./routes/home.js
./routes/index.js
./routes/indi.js
./routes/mediadelete.js
./routes/mediadeletepost.js
./routes/mediaedit.js
./routes/mediaeditpost.js
./routes/mediagroupspost.js
./routes/mediaimage.js
./routes/medialink.js
./routes/medialist.js
./routes/mediasummary.js
./routes/mediaupload.js
./routes/mediauploadpost.js
./routes/names.js
./routes/notes.js
./routes/search.js
./routes/source.js
./routes/surnames.js
./sample-db.about
./sample-db.cfg
./schema.txt
./schema-photos.txt
./start
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
./views/mediadelete.hbs
./views/mediaedit.hbs
./views/medialist1.hbs
./views/medialist2.hbs
./views/medialist3.hbs
./views/mediasummary.hbs
./views/mediaupload.hbs
./views/mediaview.hbs
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
