import anyDB from 'any-db';

const databases = {
    woodbridge: {
        dbURL: {
            adapter: 'sqlite3',
            database: 'db/woodbridge/woodbridge.db'
        },
        params: {
            title: 'Woodbridge Family Tree',
            owner: 'Stephen Woodbridge',
            email: 'stephenwoodbridge37 (at) gmail (dot) com',
            copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered.",
            hasPhotos: true
        }
    },
    woodbridge_record: {
        dbURL: {
            adapter: 'sqlite3',
            database: 'db/woodbridge_record/woodbridge_record.db'
        },
        params: {
            title: 'Woodbridge Record Book',
            owner: 'Stephen Woodbridge',
            email: 'stephenwoodbridge37 (at) gmail (dot) com',
            copyright: "Family Data Copyright 2001-2018 by Stephen Woodbridge, All Rights Reservered.",
            hasPhotos: false
        }
    }
};

export function createConnection(dbName) {

    var dbURL = databases[dbName]['dbURL'];
    if (typeof dbURL === 'undefined') {
        console.error("Database '" + dbName + "' is not configured!");
        return null;
    }


    var pool = anyDB.createPool(dbURL);
    pool['adapter'] = dbURL.adapter;

    return pool;
}

export default databases;

