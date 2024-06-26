CREATE TABLE PROCESS (
    PID            INT    NOT NULL CHECK(PID >= 1),
    EXEC           TEXT   NOT NULL,
    START_TIME     INT    NOT NULL CHECK(START_TIME >= 0),
    IS_ALIVE       INT    NOT NULL CHECK(IS_ALIVE IN (0, 1)),
    INIT_TOTAL_CPU REAL   NOT NULL CHECK(INIT_TOTAL_CPU >= 0),
    PRIMARY KEY (PID)
);

CREATE TABLE CPU (
    CPU_CORE     INT  NOT NULL CHECK(CPU_CORE >= 0),
    MHZ          REAL NOT NULL CHECK(MHZ >= 0),
    TOTAL_CACHE  INT  NOT NULL CHECK(TOTAL_CACHE >= 0),
    PRIMARY KEY (CPU_CORE)
);

CREATE TABLE PROCSTAT (
    PID              INT  NOT NULL,
    TIMESTAMP        INT  NOT NULL CHECK(TIMESTAMP >= 0),
    TOTAL_CPU        REAL NOT NULL CHECK(TOTAL_CPU >= 0),
    PERCENT_CPU      REAL          CHECK(PERCENT_CPU >= 0),
    CPU_CORE         INT,
    VIRTUAL_MEMORY   INT  NOT NULL CHECK(VIRTUAL_MEMORY >= 0),
    RESIDENT_MEMORY  INT  NOT NULL CHECK(RESIDENT_MEMORY >= 0),
    SHARED_MEMORY    INT  NOT NULL CHECK(SHARED_MEMORY >= 0),
    PRIMARY KEY (PID, TIMESTAMP)
    FOREIGN KEY (PID)       REFERENCES PROCESS(PID),
    FOREIGN KEY (CPU_CORE)  REFERENCES CPU(CPU_CORE)
);

CREATE TABLE CPUSTAT (
    CPU_CORE    INT  NOT NULL,
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    USAGE       REAL NOT NULL CHECK(USAGE >= 0),
    PRIMARY KEY (CPU_CORE, TIMESTAMP)
);

CREATE TABLE MEMORY (
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    TOTAL       INT  NOT NULL CHECK(TOTAL >= 0),
    FREE        INT  NOT NULL CHECK(FREE >= 0 AND FREE <= TOTAL),
    SWAP_TOTAL  INT  NOT NULL CHECK(SWAP_TOTAL >= 0),
    SWAP_FREE   INT  NOT NULL CHECK(SWAP_FREE >= 0 AND SWAP_FREE <= SWAP_TOTAL),
    PRIMARY KEY (TIMESTAMP)
);

CREATE TABLE DISK (
    DEVICE_NAME TEXT NOT NULL,
    MOUNT       TEXT NOT NULL,
    FS_TYPE     TEXT NOT NULL,
    PRIMARY KEY (DEVICE_NAME)
);

CREATE TABLE DISKSTAT (
    DEVICE_NAME TEXT NOT NULL,
    TIMESTAMP   INT  NOT NULL CHECK(TIMESTAMP >= 0),
    USED        INT  NOT NULL CHECK(USED >= 0),
    AVAILABLE   INT  NOT NULL CHECK(AVAILABLE >= 0),
    PRIMARY KEY (DEVICE_NAME, TIMESTAMP),
    FOREIGN KEY (DEVICE_NAME) REFERENCES DISK(DEVICE_NAME)
);

INSERT INTO MEMORY VALUES(987654321, 2048, 1024, 256, 0);
INSERT INTO MEMORY VALUES(987654322, 2048, 0, 256, 256);
INSERT INTO MEMORY VALUES(987654323, 2048, 1024, 256, 128);

INSERT INTO CPU VALUES (0, 5, 10);
INSERT INTO PROCESS VALUES(1, "test-exe-1", 123456790, 1, 2048);
INSERT INTO PROCSTAT VALUES(1, 987654321, 5000, 0.42, 0, 42, 42, 0);
INSERT INTO PROCSTAT VALUES(1, 987654322, 5000, 0.42, 0, 42, 42, 0);
INSERT INTO PROCESS VALUES(2, "test-exe-2", 123456790, 1, 2048);
INSERT INTO PROCSTAT VALUES(2, 987654321, 5000, 0.42, 0, 42, 42, 0);
INSERT INTO PROCSTAT VALUES(2, 987654322, 5000, 0.42, 0, 42, 42, 0);
INSERT INTO PROCESS VALUES(3, "test-exe-3", 123456790, 1, 2048);
INSERT INTO PROCSTAT VALUES(3, 987654321, 5000, 0.42, 0, 42, 42, 0);
INSERT INTO PROCSTAT VALUES(3, 987654322, 5000, 0.42, 0, 42, 42, 0);

INSERT INTO DISK VALUES("/dev1", "/mount1", "ext4");
INSERT INTO DISK VALUES("/dev2", "/mount2", "ext4");
INSERT INTO DISKSTAT VALUES("/dev1", 987654321, 42, 21);
INSERT INTO DISKSTAT VALUES("/dev1", 987654322, 39, 24);
INSERT INTO DISKSTAT VALUES("/dev2", 987654321, 42, 21);
INSERT INTO DISKSTAT VALUES("/dev2", 987654322, 39, 24);


INSERT INTO CPUSTAT VALUES(0, 987654321, 0.42);
INSERT INTO CPUSTAT VALUES(0, 987654322, 0.25);
