#!/usr/bin/env node
'use strict'

const fs = require('node:fs');
const anyDB = require('any-db');
const { parseArgs } = require('node:util');



/**
* mapTag(name)
*
* param: name   - Event name to be mapped to Gedcom TAG
* return string - the Gedcom TAG
*/
function mapTag(name) {
    var tags = {
      'Name':   	"NAME",
      'Sex':     	"SEX",
      'Birth':  	"BIRT",
      'Death':  	"DEAT",
      // "FAMS": 'Family of spouse',
      // "FAMC": 'Family of child',
      'Note':   	"NOTE",
      'Reference': 	"REFN",
      'Title':  	"TITL",
      'Occupation': 	"OCCU",
      'Event':  	"EVEN",
      'Baptism': 	"BAPM",
      'Immigration': 	"IMMI",
      'Alias':  	"ALIA",
      'Social Security No.': "SSN",
      'Residence': 	"RESI",
      'Adoption': 	"ADOP",
      'Emigration': 	"EMIG",
      'Address': 	"ADDR",
      'Phone':  	"PHON",
      'Christening': 	"CHR",
      'Will':   	"WILL",
      'Probate': 	"PROB",
      'Changed': 	"CHAN",
      'Conference': 	"CONF",
      'Graduation': 	"GRAD",
      'Ordination': 	"ORDN",
      'Cremation': 	"CREM",
      'Military': 	"_MILT",
      'Religion': 	"RELI",
      'Arrival': 	"ARVL",
      'Departure': 	"DPRT",
      'Census': 	"CENS",
      // Tags from marriages
      'Husband': 	'HUSB',
      'Wife':   	'WIFE',
      'Child':  	'CHIL',
      'Marriage': 	"MARR",
      'Divorced': 	"DIV",
      'Separated': 	"_SEPR",
      'Annulled': 	"ANUL",
    };

    var t = tags[name];
    if (typeof tags[name] === 'undefined') {
        t = name.toUpperCase();
        console.log('Missing Gedcom Tag for: ' + name);
    }

    return t;
}

function getDate() {
  let date_time = new Date();
  let date = ('0' + date_time.getDate()).slice(-2);
  let month = ('0' + (date_time.getMonth() + 1)).slice(-2);
  let year = date_time.getFullYear();
  return year + '-' + month + '-' + date;
}

function getEvents(refid, conn, res) {
  return new Promise((resolve, reject) => {
    console.log('getEvents: ' + refid);
    let sql = `select * from events where refid='${refid}' order by seq`;
    let results = '';
    conn.query(sql)
      .on('data', function (row) {
        // console.log(row);
        let tag = mapTag(row.ETYPE);
        let result = '1 ' + tag + '\n';
        if (row.DATE) result += '2 DATE ' + row.DATE + '\n';
        if (row.PLAC) result += '2 PLAC ' + row.PLAC + '\n';
        if (row.NOTE) result += '2 NOTE @' + row.NOTE + '@\n';
        results += result;
      })
      .on('end', () => {
        console.log('  end getEvents: ' + refid);
        resolve(res + results)
      })
      .on('error', (err) => console.error(err));
  });
}

function getFams(refid, conn, res) {
  return new Promise((resolve, reject) => {
    console.log('getFams: ' + refid);
    let sql = `select * from fams where indi='${refid}' order by seq`;
    let result = '';
    conn.query(sql)
      .on('error', console.error)
      .on('data', function (row) {
        // console.log(row);
        result += '1 FAMS @' + row.FAMI + '@\n';
      })
      .on('end', function() {
        console.log('  end getFams: ' + refid);
        resolve( res + result );
      })
      .on('error', (err) => console.error(err));
  })
}

function getFamc(refid, conn, res) {
  return new Promise((resolve, reject) => {
    console.log('getFamc: ' + refid);
    let sql = `select * from child where indi='${refid}' order by seq`;
    let result = '';
    conn.query(sql)
      .on('error', console.error)
      .on('data', function (row) {
        // console.log(row);
        result += '1 FAMC @' + row.FAMI + '@\n';
      })
      .on('end', function() {
        console.log('  end getFamc: ' + refid);
        resolve( res + result );
      })
      .on('error', (err) => console.error(err));
  })
}

function getChild(refid, conn, res) {
  return new Promise((resolve, reject) => {
    console.log('getChild: ' + refid);
    let sql = `select * from child where fami='${refid}' order by seq`;
    let result = '';
    conn.query(sql)
      .on('error', console.error)
      .on('data', function (row) {
        // console.log (row);
        result += '1 CHIL @' + row.INDI + '@\n';
      })
      .on('end', function() {
        console.log('  end getChild: ' + refid);
        resolve( res + result );
      })
      .on('error', (err) => console.error(err));
  })
}

function getNote(refid, conn, res) {
  return new Promise((resolve, reject) => {
    console.log('getNote: ' + refid);
    let sql = `select * from notes where note='${refid}' order by seq`;
    let result = '';
    conn.query(sql)
      .on('error', console.error)
      .on('data', function (row) {
        let line = '1 CONC ';
        if (row.TEXT && row.TEXT.length > 0) {
          let words = row.TEXT.split(/\s+/);
          words.forEach((w) => {
            if (line.length + w.length + 1 < 85) {
              line += w + ' ';
            }
            else {
              result += line + '\n';
              line = '1 CONC ' + w + ' ';
            }
          });
          result += line + '\n';
        }
        else {
          result += '1 CONT\n';
          line = '1 CONT ';
        }
      })
      .on('end', function () {
        console.log('  end getNote: ' + refid);
        resolve( res + result );
      })
      .on('error', (err) => console.error(err));
  })
}

function outputHeader(conn, writer) {
  return new Promise(async (resolve, reject) => {
    console.log('outputHeader');
    let date = getDate();
    let hdr = '0 HEAD\n'
      + '1 SOUR family-tree-nodejs\n'
      + '2 VERS 0.2.0\n'
      + '3 WWW github.com/woodbri/family-tree-nodejs\n'
      + '1 DATE ' + date + '\n'
      + '1 CHAR UTF-8\n';
    writer.write(hdr);
    resolve();
  })
}

function outputSubm(conn, writer) {
  return new Promise(async (resolve, reject) => {
    console.log('outputSubm');
    writer.write('0 @SUBM@ SUBM\n');
    resolve();
  })
}

function outputIndi(conn, conn2, writer) {
  return new Promise((resolve, reject) => {
    console.log('outputIndi');
    // indi, lname, fname, title, lname_mp, famc, sex, refn, note, bdate, ddate, living
    let sql = 'select * from indi order by indi limit 5';
    conn.query(sql)
      .on('data', async function (row) {
        console.log('Fetching data for ' + row.INDI);
        let res = '0 @' + row.INDI + '@ INDI\n'
          + '1 NAME ' + row.FNAME + ' /' + row.LNAME + '/\n'
          + '2 SURN ' + row.LNAME + '\n'
          + '2 GIVN ' + row.FNAME + '\n'
          + '1 SEX ' + row.SEX + '\n';
        if (row.REFN) res += '1 REFN ' + row.REFN + '\n';
        if (row.NOTE) res += '1 NOTE @' + row.NOTE + '@\n';
        res = await getEvents(row.INDI, conn2, res);
        res = await getFams(row.INDI, conn2, res);
        res = await getFamc(row.INDI, conn2, res);
        writer.write(res);
      })
      .on('end', () => {
        console.log('  outputIndi done');
        resolve()
      })
      .on('error', (err) => console.error(err));
  })
}

function outputFam(conn, conn2, writer) {
  return new Promise((resolve, reject) => {
    console.log('outputFam');
    let sql = 'select * from fami order by fami limit 5';
    conn.query(sql)
      .on('data', async function (row) {
        // console.log(row);
        let res = '0 @' + row.FAMI + '@ FAM\n';
          if (row.HUSB) res += '1 HUSB @' + row.HUSB + '@\n';
          if (row.WIFE) res += '1 WIFE @' + row.WIFE + '@\n';
          if (row.NOTE) res += '1 NOTE @' + row.NOTE + '@\n';
          res = await getEvents(row.FAMI, conn2, res);
          res = await getChild(row.FAMI, conn2, res);
          writer.write(res);
      })
      .on('end', () => {
        console.log('  outputFam done');
        resolve()
      })
      .on('error', (err) => console.error(err));
  })
}

function outputNotes(conn, conn2, writer) {
  return new Promise((resolve, reject) => {
    console.log('outputNotes');
    let sql = 'select distinct note from notes order by note limit 20';
    let lines = '';
    conn.query(sql)
      .on('data', async function(row) {
        // console.log(row);
        let res = `0 @${row.NOTE}@ NOTE\n`;
        res = await getNote(row.NOTE, conn2, res);
        writer.write(res);
      })
      .on('end', () => {
        console.log('  outputNotes done');
        resolve()
      })
      .on('error', (err) => console.error(err));
  })
}

function outputSour(conn, writer) {
  return new Promise(async (resolve, reject) => {
    console.log('outputSour');
    // TODO
    resolve();
  })
}

function outputRepo(conn, writer) {
  return new Promise(async (resolve, reject) => {
    console.log('outputRepo');
    // TODO
    resolve();
  })
}

function outputTrlr(conn, writer) {
  return new Promise(async (resolve, reject) => {
    console.log('outputTrlr');
    writer.write('0 TRLR\n');
    resolve();
  })
}


async function main() {
  
  const options = {
    'help': { type: 'boolean', short: 'h' },
    'db':   { type: 'string' },
    'ged':  { type: 'string' }
  };
  const args = ['-h', '--db', '--ged'];
  const {values, tokens} = parseArgs({options, token: true});

  const dbfile = values.db ?? 'test.db';
  const ged = values.ged ?? 'test-out.ged';

  if (values.help) {
    console.log('Usage: dump-db-as-ged -h | --db=dbfile.db --ged=output.ged');
    process.exit();
  }

  console.log('dbfile: ', dbfile);
  console.log('ged: ', ged);

  const writer = fs.createWriteStream( ged, { flags: 'w', encoding: 'utf8' } );
  writer.on('error', (error) => {
    console.log(`An error occured while writing to the file. Error: ${error.message}`);
    reject();
  });
  writer.on('finish', () => {
    console.log(`All records have been written to ${ged}.`);
    writer.close();
    resolve();
  });
  console.log('writer created');

  let conn = anyDB.createConnection({
    adapter: 'sqlite3',
    database: dbfile
  });
  let conn2 = anyDB.createConnection({
    adapter: 'sqlite3',
    database: dbfile
  });
  let conn3 = anyDB.createConnection({
    adapter: 'sqlite3',
    database: dbfile
  });
  console.log('database conn and conn2 created');

  await outputHeader(conn, writer);
  await outputSubm(conn, writer);
  await outputIndi(conn, conn2, writer);
  await outputFam(conn, conn2, writer);
  await outputNotes(conn3, conn, writer);
  await outputSour(conn, writer);
  await outputRepo(conn, writer);
  await outputTrlr(conn, writer);

}


main();
 
