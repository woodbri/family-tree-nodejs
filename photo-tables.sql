PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE indi_photos (
    indi varchar(10),
    id integer,
    primary key (id, indi),
    foreign key (indi) references indi(indi)
);
CREATE INDEX indi_photos_indi_idx on indi_photos (indi);
COMMIT;
BEGIN TRANSACTION;
CREATE TABLE photos (
    id integer primary key,
    type varchar(5),
    date varchar(10),
    tdate varchar(50),
    title varchar(50),
    desc text,
    gid integer
);
COMMIT;
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE pgroups (
    id integer primary key,
    desc varchar(200)
);
COMMIT;

