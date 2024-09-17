#!/usr/bin/env node
'use strict';

import { finished } from 'stream/promises';
import fs from 'node:fs';
import anyDB from 'any-db';
import { parseArgs } from 'node:util';


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
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Ensure 2 digits
  const day = String(now.getDate()).padStart(2, '0');        // Ensure 2 digits
  return `${year}-${month}-${day}`;
}

async function getEvents(refid, conn, res) {
  try {
    console.log('getEvents: ' + refid);
    const sql = `SELECT * FROM events WHERE refid = ? ORDER BY seq`;
    let results = '';

    await new Promise((resolve, reject) => {
      conn.query(sql, [refid])
        .on('data', (row) => {
          let tag = mapTag(row.ETYPE);
          results += `1 ${tag}\n`;
          if (row.DATE) results += `2 DATE ${row.DATE}\n`;
          if (row.PLAC) results += `2 PLAC ${row.PLAC}\n`;
          if (row.NOTE) results += `2 NOTE @${row.NOTE}@\n`;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log('  end getEvents: ' + refid);
    return res + results;
  } catch (error) {
    console.error(`Error fetching events for ${refid}:`, error);
    throw error;  // rethrow to be handled by caller
  }
}

async function getFams(refid, conn, res) {
  try {
    console.log(`getFams: ${refid}`);
    const sql = 'SELECT * FROM fams WHERE indi = ? ORDER BY seq';
    
    const results = await new Promise((resolve, reject) => {
      let famsResults = '';
      conn.query(sql, [refid])
        .on('data', (row) => {
          famsResults += `1 FAMS @${row.FAMI}@\n`;
        })
        .on('end', () => resolve(famsResults))
        .on('error', reject);
    });

    console.log(`  end getFams: ${refid}`);
    return res + results;
  } catch (error) {
    console.error(`Error fetching families for ${refid}:`, error);
    throw error;
  }
}

async function getFamc(refid, conn, res) {
  try {
    console.log(`getFamc: ${refid}`);
    const sql = 'SELECT * FROM child WHERE indi = ? ORDER BY seq';

    const results = await new Promise((resolve, reject) => {
      let famcResults = '';
      conn.query(sql, [refid])
        .on('data', (row) => {
          famcResults += `1 FAMC @${row.FAMI}@\n`;
        })
        .on('end', () => resolve(famcResults))
        .on('error', reject);
    });

    console.log(`  end getFamc: ${refid}`);
    return res + results;
  } catch (error) {
    console.error(`Error fetching FAMC for ${refid}:`, error);
    throw error;
  }
}

async function getChild(refid, conn, res) {
  try {
    console.log(`getChild: ${refid}`);
    const sql = 'SELECT * FROM child WHERE fami = ? ORDER BY seq';

    const results = await new Promise((resolve, reject) => {
      let childResults = '';
      conn.query(sql, [refid])
        .on('data', (row) => {
          childResults += `1 CHIL @${row.INDI}@\n`;
        })
        .on('end', () => resolve(childResults))
        .on('error', reject);
    });

    console.log(`  end getChild: ${refid}`);
    return res + results;
  } catch (error) {
    console.error(`Error fetching children for ${refid}:`, error);
    throw error;
  }
}

async function getNote(refid, conn, res) {
  try {
    console.log(`getNote: ${refid}`);
    const sql = 'SELECT * FROM notes WHERE note = ? ORDER BY seq';

    const results = await new Promise((resolve, reject) => {
      let noteResults = '';
      conn.query(sql, [refid])
        .on('data', (row) => {
          if (row.TEXT && row.TEXT.length > 0) {
            let words = row.TEXT.split(/\s+/);
            let line = '1 CONC ';
            words.forEach((word) => {
              if (line.length + word.length + 1 < 85) {
                line += word + ' ';
              } else {
                noteResults += `${line}\n`;
                line = `1 CONC ${word} `;
              }
            });
            noteResults += `${line}\n`;
          } else {
            noteResults += '1 CONT\n';
          }
        })
        .on('end', () => resolve(noteResults))
        .on('error', reject);
    });

    console.log(`  end getNote: ${refid}`);
    return res + results;
  } catch (error) {
    console.error(`Error fetching notes for ${refid}:`, error);
    throw error;
  }
}

async function processQuery(conn, query, processRow) {
  return new Promise((resolve, reject) => {
    let result = '';
    conn.query(query)
      .on('data', row => result += processRow(row))
      .on('end', () => resolve(result))
      .on('error', reject);
  });
}

async function outputHeader(conn, writer) {
  console.log('outputHeader');
  const date = getDate();
  const hdr = `0 HEAD\n1 SOUR family-tree-nodejs\n2 VERS 0.2.0\n3 WWW github.com/woodbri/family-tree-nodejs\n1 DATE ${date}\n1 CHAR UTF-8\n`;
  writer.write(hdr);
}

async function outputSubm(conn, writer) {
  console.log('outputSubm');
  writer.write('0 @SUBM@ SUBM\n');
}

async function outputIndi(conn, conn2, writer) {
  const query = 'select * from indi order by indi limit 5';
  await processQuery(conn, query, async (row) => {
    console.log('Fetching data for ' + row.INDI);
    let res = `0 @${row.INDI}@ INDI\n1 NAME ${row.FNAME} /${row.LNAME}/\n2 SURN ${row.LNAME}\n2 GIVN ${row.FNAME}\n1 SEX ${row.SEX}\n`;
    if (row.REFN) res += `1 REFN ${row.REFN}\n`;
    if (row.NOTE) res += `1 NOTE @${row.NOTE}@\n`;
    res = await getEvents(row.INDI, conn2, res);
    res = await getFams(row.INDI, conn2, res);
    res = await getFamc(row.INDI, conn2, res);
    writer.write(res);
  });
}

async function outputFam(conn, conn2, writer) {
  const query = 'select * from fami order by fami limit 5';
  await processQuery(conn, query, async (row) => {
    let res = `0 @${row.FAMI}@ FAM\n`;
    if (row.HUSB) res += `1 HUSB @${row.HUSB}@\n`;
    if (row.WIFE) res += `1 WIFE @${row.WIFE}@\n`;
    if (row.NOTE) res += `1 NOTE @${row.NOTE}@\n`;
    res = await getEvents(row.FAMI, conn2, res);
    res = await getChild(row.FAMI, conn2, res);
    writer.write(res);
  });
}

async function outputNotes(conn, conn2, writer) {
  const query = 'select distinct note from notes order by note limit 20';
  await processQuery(conn, query, async (row) => {
    let res = `0 @${row.NOTE}@ NOTE\n`;
    res = await getNote(row.NOTE, conn2, res);
    writer.write(res);
  });
}

async function outputTrlr(conn, writer) {
  try {
    writer.write('0 TRLR\n');
  } catch (error) {
    console.error('Error writing TRLR:', error);
  }
}

async function main() {
  const options = {
    'help': { type: 'boolean', short: 'h' },
    'db':   { type: 'string' },
    'ged':  { type: 'string' }
  };
  const { values } = parseArgs({ options });

  const dbfile = values.db ?? 'test.db';
  const ged = values.ged ?? 'test-out.ged';

  if (values.help) {
    console.log('Usage: dump-db-as-ged -h | --db=dbfile.db --ged=output.ged');
    process.exit();
  }

  const writer = fs.createWriteStream(ged, { flags: 'w', encoding: 'utf8' });
  writer.on('error', (error) => console.log(`Write error: ${error.message}`));

  const conn = anyDB.createConnection({ adapter: 'sqlite3', database: dbfile });
  const conn2 = anyDB.createConnection({ adapter: 'sqlite3', database: dbfile });
  const conn3 = anyDB.createConnection({ adapter: 'sqlite3', database: dbfile });

  try {
    await outputHeader(conn, writer);
    await outputSubm(conn, writer);
    await outputIndi(conn, conn2, writer);
    await outputFam(conn, conn2, writer);
    await outputNotes(conn3, conn, writer);
    await outputTrlr(conn, writer);

    await finished(writer); // Wait until writing is finished
  } catch (err) {
    console.error('Error occurred:', err);
  } finally {
    conn.end();
    conn2.end();
    conn3.end();
  }
}

main();

