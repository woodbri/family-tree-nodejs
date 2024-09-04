#!python

from datetime import datetime
import sqlite3
import argparse
import re

# https://docs.python.org/3/howto/argparse.html

parser = argparse.ArgumentParser()
parser.add_argument("db_file", help="input sqlite3 database")
parser.add_argument("ged_file", help="output GED file")
parser.add_argument("-d", "--debug", help="turn on verbose debugging", action="store_true")
args = parser.parse_args()

limit = ''
if (args.debug):
    limit = 'limit 5'

tags = {
      'Name':           "NAME",
      'Sex':            "SEX",
      'Birth':          "BIRT",
      'Death':          "DEAT",
      'Buried':         "BURI",
      # "FAMS": 'Family of spouse',
      # "FAMC": 'Family of child',
      'Note':           "NOTE",
      'Reference':      "REFN",
      'Title':          "TITL",
      'Occupation':     "OCCU",
      'Event':          "EVEN",
      'Baptism':        "BAPM",
      'Immigration':    "IMMI",
      'Alias':          "ALIA",
      'Social Security No.': "SSN",
      'Residence':      "RESI",
      'Adoption':       "ADOP",
      'Emigration':     "EMIG",
      'Address':        "ADDR",
      'Phone':          "PHON",
      'Christening':    "CHR",
      'Will':           "WILL",
      'Probate':        "PROB",
      'Changed':        "CHAN",
      'Conference':     "CONF",
      'Graduation':     "GRAD",
      'Ordination':     "ORDN",
      'Cremation':      "CREM",
      'Military':       "_MILT",
      'Religion':       "RELI",
      'Arrival':        "ARVL",
      'Departure':      "DPRT",
      'Census':         "CENS",
      # Tags from marriages
      'Husband':        'HUSB',
      'Wife':           'WIFE',
      'Child':          'CHIL',
      'Marriage':       "MARR",
      'Divorced':       "DIV",
      'Separated':      "_SEPR",
      'Annulled':       "ANUL"
    }

def dprint(string):
    if (args.debug):
        print(string)


def writeEvents(refid, cur, writer):
    dprint('writeEvents')
    # refid, seq, etype, date, plac, note, text, edate
    sql = f'select * from events where refid={refid!r} order by seq'
    for row in cur.execute(sql):
        if (row['ETYPE'] in tags):
            tag = tags[row['ETYPE']]
        else:
            tag = row['ETYPE']
        writer.write(f'1 {tag}' + '\n')
        if (row['DATE'] is not None):
            writer.write(f'2 DATE {row["DATE"]}' + '\n')
        if (row['PLAC'] is not None):
            writer.write(f'2 PLAC {row["PLAC"]}' + '\n')
        if (row['NOTE'] is not None):
            writer.write(f'2 NOTE @{row["NOTE"]}@' + '\n')


def writeFams(refid, cur, writer):
    dprint('writeFams')
    sql = f'select * from fams where indi={refid!r} order by seq'
    for row in cur.execute(sql):
        writer.write(f'1 FAMS @{row["FAMI"]}@' + '\n')

def writeFamc(refid, cur, writer):
    dprint('writeFamc')
    sql = f'select * from child where indi={refid!r} order by seq'
    for row in cur.execute(sql):
        writer.write(f'1 FAMC @{row["FAMI"]}@' + '\n')

def writeChild(refid, cur, writer):
    dprint('writeChild')
    sql = f'select * from child where fami={refid!r} order by seq'
    for row in cur.execute(sql):
        writer.write(f'1 CHILD @{row["INDI"]}@' + '\n')

def writeNote(refid, cur, writer):
    dprint('writeNote')
    sql = f'select * from notes where note={refid!r} order by seq'
    for row in cur.execute(sql):
        line = '1 CONC '
        if (row['TEXT'] is not None and len(row['TEXT']) > 0):
            words = re.split("\s+", row['TEXT'])
            for w in words:
                if (len(line) + len(w) + 1 < 85):
                    line += w + ' '
                else:
                    writer.write(line + '\n')
                    line = '1 CONC ' + w + ' '
            writer.write(line + '\n')
        else:
            writer.write('1 CONT\n')
            line = '1 CONT '

def outputHeader(date, writer):
    dprint('outputHeader')
    hdr = '''0 HEAD
1 SOUR family-tree-nodejs
2 VERS 0.2.0
3 WWW github.com/woodbri/family-tree-nodejs
1 DATE {}
1 CHAR UTF-8
1 SUBM @SUBM@
1 FILE {}
1 GEDC
2 VERS 5.5
'''.format(date, args.ged_file)
    writer.write(hdr)

def outputSubm(cur, writer):
    dprint('outputSubm')
    writer.write('0 @SUBM@ SUBM\n')


def outputIndi(cur, cur2, writer):
    dprint('outputIndi')
    # indi, lname, fname, title, lname_mp, famc, sex, refn, note, bdate, ddate, living
    sql = 'select * from indi order by indi ' + limit
    for row in cur.execute(sql):
        writer.write(f"0 @{row['INDI']}@ INDI\n")
        writer.write(f"1 NAME {row['FNAME']} /{row['LNAME']}/\n")
        writer.write(f"2 SURN {row['LNAME']}\n")
        writer.write(f"2 GIVN {row['FNAME']}\n")
        writer.write(f"1 SEX {row['SEX']}\n")
        if (row['REFN'] is not None):
            writer.write(f"1 REFN {row['REFN']}\n")
        if (row['NOTE'] is not None):
            writer.write(f"1 NOTE @{row['NOTE']}@\n")
        writeEvents(row['INDI'], cur2, writer)
        writeFams(row['INDI'], cur2, writer)
        writeFamc(row['INDI'], cur2, writer)


def outputFam(cur, cur2, writer):
    dprint('outputFam')
    sql = 'select * from fami order by fami ' + limit
    for row in cur.execute(sql):
        writer.write(f'0 @{row["FAMI"]}@ FAM' + '\n')
        if (row['HUSB'] is not None):
            writer.write(f'1 HUSB @{row["HUSB"]}@' + '\n')
        if (row['WIFE'] is not None):
            writer.write(f'1 WIFE @{row["WIFE"]}@' + '\n')
        if (row['NOTE'] is not None):
            writer.write(f'1 NOTE @{row["NOTE"]}@' + '\n')
        writeEvents(row['FAMI'], cur2, writer)
        writeChild(row['FAMI'], cur2, writer)


def outputNotes(cur, cur2, writer):
    dprint('outputNotes')
    sql = 'select distinct note from notes order by note ' + limit
    for row in cur.execute(sql):
        writer.write(f'0 @{row["NOTE"]}@ NOTE' + '\n')
        writeNote(row['NOTE'], cur2, writer)


def outputSour(cur, writer):
    dprint('outputSour')
    # table fields: sour, titl, auth, publ, repo
    sql = 'select * from sour order by sour ' + limit
    for row in cur.execute(sql):
        writer.write(f'0 @{row["SOUR"]}@ SOUR' + '\n')
        if (row['TITL'] is not None):
            writer.write(f'1 TITL {row["TITL"]}' + '\n')
        if (row['AUTH'] is not None):
            writer.write(f'1 AUTH {row["AUTH"]}' + '\n')
        if (row['PUBL'] is not None):
            writer.write(f'1 PUBL {row["PUBL"]}' + '\n')
        if (row['REPO'] is not None):
            if (row['REPO'][0:8] == 'NOTE: @'):
                writer.write('1 REPO\n')
                writer.write('2 NOTE @' + row['REPO'][8:-1] + '@\n')


def outputRepo(cur, writer):
    dprint('outputRepo')
    # TODO
    # we don't currently support REPO as a level 0 record
    # it is handled via SOUR table and a 'NOTE: @NSnnnnn@' in the REPO field
    # RootsMagic does use '0 @Rnn@ REPO' which we'll need to deal with
    # in addition to a lot of custom tags


def outputTrlr(cur, writer):
    dprint('outputTrlr')
    writer.write('0 TRLR\n')


def main():

    date = datetime.now().strftime('%Y-%m-%d')

    conn = sqlite3.connect(args.db_file)
    conn.row_factory = sqlite3.Row

    # we need two curors because we make second dependent queries and if you use the same
    # cursor for the second query it wipes out the first before it is finished
    cur = conn.cursor()
    cur2 = conn.cursor()

    with open(args.ged_file, 'w', encoding='utf-8') as writer:

        outputHeader(date, writer);
        outputSubm(cur, writer);
        outputIndi(cur, cur2, writer);
        outputFam(cur, cur2, writer);
        outputNotes(cur, cur2, writer);
        outputSour(cur, writer);
        outputRepo(cur, writer);
        outputTrlr(cur, writer);

    conn.close()
    
main()
