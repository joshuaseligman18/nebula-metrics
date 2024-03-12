+++
title = 'Tech Stack in Detail'
+++

![Tech stack of Nebula Metrics](/images/techStack.png)

## Rust
Rust is a programming language that provides the performance of C without
the need to manually manage memory due to its unique system of ownership with
the borrow checker. In other words, Rust is memory safe from its additional
checks at compile time, which greatly improves memory safety through reduced
memory leaks and other bad practices within our programs. Rust comes with the
[Cargo](https://doc.rust-lang.org/cargo/index.html) package manager to easily
add external dependencies to our programs without the need for manually
writing a build script to compile and link everything together.

More information about Rust can be found [here](https://www.rust-lang.org/).

## SQLite 3
SQLite 3 is a file-based SQL database that stores all data on-device without the
need for a centralized database server. This feature is imperative for Nebula
Metrics as all data should be kept private and only stored on the device running
Nebula Metrics.

More information about SQLite 3 can be found [here](https://www.sqlite.org/).

## TypeScript / React.js
TypeScript provides type safety to our JavaScript code for the dashboard, which
is important as some metrics are complex and need to be well-defined to easily
work with them throughout the website. Additionally, we will be leveraging the
React.js front-end library to build components for the website in a modular fashion.
Furthermore, since it is a JavaScript-based application, the dashboard will be
a [Node.js](https://nodejs.org/en) project that, like Rust, has a package manager
for adding additional dependencies to the dashboard website.

More information about TypeScript can be found [here](https://www.typescriptlang.org).

More information about React.js can be found [here](https://react.dev).

## GitHub Actions
GitHub Actions is an automated pipelining tool for continuous integration and
continuous delivery (CI/CD) of applications. Workflows are defined in YAML and
can be triggered through native GitHub events, such as pull requests and pushes
to a branch. Nebula Metrics takes advantage of GitHub Actions to automate
testing as a check before approving a pull request as well as creating a new
release for the application with the appropriate packaged files attached.

More information about GitHub Actions can be found [here](https://github.com/features/actions).

## Linux (Ubuntu)
Nebula Metrics is built for Linux, specifically the Debian and Ubuntu variety of
distributions. Our application is packaged using the [cargo-deb](https://crates.io/crates/cargo-deb)
Cargo helper. This tool packages our compiled binaries into Systemd services and
also allows us to define scripts that get run before and after installation and
removal, which Nebula Metrics takes advantage of to set up the database and clean
up files. Since cargo-deb produces a *.deb* file, only Linux distributions that
support this file type can run Nebula Metrics (i.e., Debian and Ubuntu varieties).
Thus, all local testing is done in an Ubuntu VM and all GitHub Actions runs are
done in Ubuntu for consistency.

More information about Ubuntu can be found [here](https://ubuntu.com/).
