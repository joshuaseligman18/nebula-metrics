CREATE TABLE DISK (
    DEVICENAME  TEXT NOT NULL,
    MOUNT       TEXT NOT NULL,
    TYPE        TEXT NOT NULL,
    PRIMARY KEY (DEVICENAME)
);

INSERT INTO DISK VALUES ("/old/device", "/old/mount", "ext4");
INSERT INTO DISK VALUES ("/test/disk", "/test/folder", "ext4");
