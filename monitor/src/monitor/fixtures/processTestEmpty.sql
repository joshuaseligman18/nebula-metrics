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

INSERT INTO CPU VALUES (0, 5, 10);
