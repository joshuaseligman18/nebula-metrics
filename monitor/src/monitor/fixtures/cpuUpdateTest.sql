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

INSERT INTO CPU VALUES (0, 9.99, 42);
INSERT INTO CPUSTAT VALUES (0, 123456780, 0);
INSERT INTO PROCESS VALUES (1, "test-exe", 123456788, TRUE, 0);
INSERT INTO PROCESS VALUES (2, "test-exe2", 123456788, TRUE, 0);
INSERT INTO PROCESS VALUES (3, "test-exe3", 123456788, TRUE, 0);
INSERT INTO PROCSTAT VALUES (1, 123456780, 0.05, NULL, 0, 42, 21, 0);
INSERT INTO PROCSTAT VALUES (1, 123456790, 0.09, NULL, 0, 42, 21, 0);
INSERT INTO PROCSTAT VALUES (2, 123456780, 0.5, NULL, 0, 42, 21, 0);
INSERT INTO PROCSTAT VALUES (2, 123456790, 1.0, NULL, 0, 42, 21, 0);
INSERT INTO PROCSTAT VALUES (3, 123456790, 1.0, NULL, 0, 42, 21, 0);
