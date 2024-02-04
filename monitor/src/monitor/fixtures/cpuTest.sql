CREATE TABLE CPU (
    CPUCORE     INT NOT NULL CHECK(CPUCORE >= 0),
    MHZ         REAL         CHECK(MHZ >= 0),
    TOTALCACHE  INT          CHECK(TOTALCACHE >= 0),
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

INSERT INTO CPU VALUES (0, 9.99, 42);
INSERT INTO CPU VALUES (99, 42.42, 10);
INSERT INTO PROCSTAT VALUES (1, 123456789, 50, 0, 42, 21, 0);
INSERT INTO PROCSTAT VALUES (1, 123456790, 50, 99, 42, 21, 0);
INSERT INTO CPUSTAT VALUES(0, 1234567891, 0);
INSERT INTO CPUSTAT VALUES(99, 1234567891, 0);
