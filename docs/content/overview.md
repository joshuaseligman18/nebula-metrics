+++
title = 'How Nebula Metrics Works'
weight = 20
+++

![Design approach of Nebula Metrics](/images/designApproach.png)

Nebula Metrics is broken up into 3 main components: monitor, API, and dashboard.
The platform also uses a database for persistent storage of the colected metrics.
The following sections describe these parts in detail regarding how they work and
some of the key design decisions.

## Monitor
The monitor runs on a scheduled interval to collect and aggregrate the relevant
information for the end-user to fetch. This component is written in the
[Rust](https://www.rust-lang.org/) programming language with the
[tokio](https://tokio.rs/) asynchronous runtime to be able to run async/await
code and makes multithreading easier with multiple tasks needing to run at the
same time.

Since Nebula Metrics is built exclusively for Linux, the
[procfs](https://crates.io/crates/procfs) package will be utilized as the interface
to the procfs psuedo-filesystem in Linux to obtain all of the key process and
system metrics. This package does not cover everything (e.g., disk information),
so Nebula Metrics also runs some basic shell commands to obtain the remaining
informaition that procfs does not provide.

## Database
The database for Nebula Metrics is an SQLite 3 database, which is file-based and
does not require a remote server to store the data. This is critical for security
as data are independent for each system, and no machine's data should be stored
in a common place with another machine's metrics. Instead, all data are stored
on-device in a single file, which simplifies the architecture and does not
require an internet connection to run Nebula Metrics.

System metrics become outdated and irrelevant after a certain period of time,
which makes data past a certain age not needed anymore within the database.
Thus, the monitor also handles pruning the database on an infrequent interval to
make sure only the most recent data are stored on-device and that the database
does not completely use up the system's storage.

## API

## Dashboard

