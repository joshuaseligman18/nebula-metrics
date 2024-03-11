+++
title = 'What is Nebula Metrics?'
+++

## Problem Statement
In recent years, software engineering has relied heavily on remote infrastructure
for deploying applications. Whether these machines are managed by a cloud provider
(e.g., AWS EC2 instances), hosted in an on-premise datacenter, or located on a
hobbyist's server rack, knowing the health status of all running instances is
critical to minimize application downtime.

Built-in tools like Task Manager and System Monitor are great when a user has
access to the machine's GUI interface. However, most remote servers only have
terminal access through SSH, making it impossible to take advantage of these
useful tools. The same metrics are acessible through the terminal, but it is
much more complicated and difficult to use and interpret. Specifically, one
would have to run a series of commands to get the base information and may have
to manually aggregate the results to see the overall system metrics. This
tedious process is unacceptable, especially in situations with hundreds or
thousands of instances that a system administrator has to manage simultaneously.
Thus, there is a serious need for being able to easily access this vital information
and have the data presented in an interpretable format to minimize the upfront
work done by an admin.

## Solution - Nebula Metrics
Nebula Metrics is a system resource utilization monitor designed to keep track
of both general system and process-specific metrics on Linux machines. The monitor
collects all current information about running processes and aggregates them
to present the end-user with a holistic representation of the resource metrics.
