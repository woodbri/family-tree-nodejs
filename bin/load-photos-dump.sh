#!/bin/sh

function Usage {
    echo "Usage: load-photos-dump.sh database dump-photos.sql"
    echo "   NOTE: this will DROP TABLEs pgroups, photos, indi_photos"
    echo "         and reload them from the dump file"
    echo "         MAKE A BACKUP COPY FIRST!!!!!"
    echo "         MAKE A BACKUP COPY FIRST!!!!!"
    exit 0
}

if [[ "$1" = "" || "$2" = "" ]] ; then
    Usage
fi

sqlite3 "$1" <<EOF
BEGIN;
drop table pgroups;
drop table photos;
drop table indi_photos;
COMMIT;
.read "$2"
.quit
EOF
