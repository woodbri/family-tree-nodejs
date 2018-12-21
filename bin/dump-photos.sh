#!/bin/sh

function Usage {
    echo "Usage: dump-photos.sh database output.sql"
    exit 0
}

if [[ "$1" = "" || "$2" = "" ]] ; then
    Usage
fi

sqlite3 "$1" <<EOF
.output "$2"
.dump pgroups
.dump photos
.dump indi_photos
.quit
EOF
