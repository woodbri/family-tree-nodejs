# Media associated with database(s)

In this directory each database installed can have a sub-directory named with its respective
database. In each database directory there are three sub-directories ``orig``, ``web``, and
``thumb``. When an image is uploaded it will get assigned a unique number and saved into the
``orig`` directory, then a copy gets resized and converted to jpeg format into each of the
``web`` and ``thumb`` directories. If you want to archive this data, first export the images
database which will create ``images.csv`` and ``imageindi.csv`` files then backup
``media/<dbName>/`` along with your GEDCOM file.
