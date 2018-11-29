# Media associated with database(s)

In this directory each database installed can have a sub-directory named with its respective
database. In each database directory there are three sub-directories ``orig``, ``web``, and
``thumb``. When an image is uploaded it will get assigned a unique number and saved into the
``orig`` directory, then a copy gets resized and converted to jpeg format into each of the
``web`` and ``thumb`` directories. If you want to archive this data, first export the photo
tables or the whole database to the text file using the following tools from the command line.

```
# assumes the database is woodbridge

# dump the whole database
sqlite3 db/woodbridge/woodbridge.db
    .output woodbridge.sql
    .dump
    .quit

# for just the photo tables
sqlite3 db/woodbridge/woodbridge.db
    .output woodbridge.photos.sql
    .dump photos
    .output woodbridge.indi_photos.sql
    .dump indi_photos
    .output woodbridge.pgroups.sql
    .dump pgroups
    .quit

# to restore these tables use
sqlite3 new-database.db
    .read woodbridge.photos.sql
    .read woodbridge.indi_photos.sql
    .read woodbridge.pgroups.sql
    .quit
```

Now archive all the photos and the sql files together into an archive file like zip or tar.
