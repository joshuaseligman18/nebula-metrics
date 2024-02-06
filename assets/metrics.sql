PRAGMA journal_mode=WAL;

CREATE TABLE PROCESS (
    PID          INT    NOT NULL CHECK(PID >= 1),
    EXEC         TEXT   NOT NULL,
    STARTTIME    INT    NOT NULL CHECK(STARTTIME >= 0),
    ISALIVE      INT    NOT NULL CHECK(ISALIVE IN (0, 1)),
    INITTOTALCPU REAL   NOT NULL CHECK(INITTOTALCPU >= 0),
    PRIMARY KEY (PID)
);

CREATE TABLE CPU (
    CPUCORE     INT  NOT NULL CHECK(CPUCORE >= 0),
    MHZ         REAL NOT NULL CHECK(MHZ >= 0),
    TOTALCACHE  INT  NOT NULL CHECK(TOTALCACHE >= 0),
    PRIMARY KEY (CPUCORE)
);

CREATE TABLE PROCSTAT (
    PID             INT  NOT NULL,
    TIMESTAMP       INT  NOT NULL CHECK(TIMESTAMP >= 0),
    TOTALCPU        REAL NOT NULL CHECK(TOTALCPU >= 0),
    CPUCORE         INT,
    VIRTUALMEMORY   INT  NOT NULL CHECK(VIRTUALMEMORY >= 0),
    RESIDENTMEMORY  INT  NOT NULL CHECK(RESIDENTMEMORY >= 0),
    SHAREDMEMORY    INT  NOT NULL CHECK(SHAREDMEMORY >= 0),
    PRIMARY KEY (PID, TIMESTAMP)
    FOREIGN KEY (PID)     REFERENCES PROCESS(PID),
    FOREIGN KEY (CPUCORE) REFERENCES CPU(CPUCORE)
);

CREATE TABLE CPUSTAT (
    CPUCORE     INT  NOT NULL,
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    USAGE       REAL NOT NULL CHECK(USAGE >= 0),
    PRIMARY KEY (CPUCORE, TIMESTAMP)
);

CREATE TABLE MEMORY (
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    TOTAL       INT  NOT NULL CHECK(TOTAL >= 0),
    FREE        INT  NOT NULL CHECK(FREE >= 0 AND FREE <= TOTAL),
    SWAPTOTAL   INT  NOT NULL CHECK(SWAPTOTAL >= 0),
    SWAPFREE    INT  NOT NULL CHECK(SWAPFREE >= 0 AND SWAPFREE <= SWAPTOTAL),
    PRIMARY KEY (TIMESTAMP)
);

CREATE TABLE DISK (
    DEVICENAME  TEXT NOT NULL,
    MOUNT       TEXT NOT NULL,
    TYPE        TEXT NOT NULL,
    PRIMARY KEY (DEVICENAME)
);

CREATE TABLE DISKSTAT (
    DEVICENAME  TEXT NOT NULL,
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    USED        INT  NOT NULL CHECK(USED >= 0),
    AVAILABLE   INT  NOT NULL CHECK(AVAILABLE >= 0),
    PRIMARY KEY (DEVICENAME, TIMESTAMP),
    FOREIGN KEY (DEVICENAME) REFERENCES DISK(DEVICENAME)
);
