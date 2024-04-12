+++
title = 'Installation Instructions'
weight = 40
+++

## Download Nebula Metrics
Official released versions of Nebula Metrics can be found in the GitHub
repository [here](https://github.com/joshuaseligman18/nebula-metrics/releases).
If, however, you want to build Nebula Metrics from the source code, see
[Contributing to Nebula Metrics](contributing) for the details for how to set up
all of the required dependencies on your local machine.

## Installation
Once you have a packaged *.deb* file for Nebula Metrics, it is now time to install.
Run `sudo apt install <PATH_TO_DEB_FILE>` to install Nebula Metrics. This command 
will take care of any additional dependencies that you may not have, namely
SQLite 3, as well as setting up all of the local files.

*Note: If you are reinstalling the version of Nebula Metrics that is already on
the machine, you must first uninstall it with `sudo apt remove nebula-metrics`.
This step is not needed if you are installing a different version of Nebula Metrics.*

## Running
Nebula Metrics comes packaged as two Systemd services: nebula-metrics.service and
nebula-server.service. Starting the former will also start up the latter, but
shutting them down has to be done independently. The below commands describe how
to run Nebula Metrics.
* Start Nebula Metrics: `systemctl start nebula-metrics.service`
* Stop Nebula Metrics: `systemctl stop nebula-metrics.service`
* Get the status of Nebula Metrics: `systemctl status nebula-metrics.service`
* Set Nebula Metrics to start at OS boot: `systemctl enable nebula-metrics.service`
