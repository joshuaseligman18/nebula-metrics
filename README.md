# Nebula Metrics
Nebula Metrics is a system metrics monitor designed to help provide resource
utilization history for Linux servers. It collects these metrics for individual
processes on a scheduled interval and aggregates them to show the system's
overall status. All data are stored on-device through an SQLite database, which
is then exposed via a REST API that a web front-end is able to call and display
the information in a user-friendly format.

# Getting Started
## Binary downloads
Official releases containing pre-compiled binaries can be found
[here](https://github.com/joshuaseligman18/nebula-metrics/releases).

## Compiling from source
In order to build Nebula Metrics locally, you will need these dependencies:
Back-end:
1. [Rust](https://www.rust-lang.org/) (recommended version >= 1.75.0)
2. [cargo-deb](https://crates.io/crates/cargo-deb)
3. Cross-compiler (if not on Linux)
([here](https://github.com/SergioBenitez/homebrew-osxct/tree/master) is a good
cross-compiler for macOS)

Front-end:
1. [Node.js](https://nodejs.org/en)
In order to build the front end, navigate to nebula-metrics/dashboard and run the 
command "npm run build"

### Setting up the Rust compiler
The only configuration that is needed for the Rust compiler is to add support
for compiling for x86_64 Linux machines. This can be achieved with a simple
`rustup target add x86_64-unknown-linux-gnu` command.

*Note: If you are not on Linux and are using a cross-compiler, you will also
have to tell Rust to use your cross-compiler. See instructions below.*
1. Create a new directory called *.cargo* in the root of the repository.
2. In the new directory, create a *config.toml* file with the below contents.
```toml
[target.x86_64-unknown-linux-gnu]
linker = "x86_64-unknown-linux-gnu-gcc" # Name of the linker binary
strip.path = "x86_64-unknown-linux-gnu-strip" # Name of the strip binary
```

### Compiling the application
In the root of the repository, run
`cargo deb --target=x86_64-unknown-linux-gnu -p monitor`. The compiled *.deb*
file will be located in the *target/x86_64-unknown-linux-gnu/debian/* directory.

## Installation
Once the Linux machine has the compiled *.deb* file, run one of the following
to install. Both will install Nebula Metrics and all of its dependencies.
```
sudo apt install <PATH_TO_DEB_FILE>
```
*OR*
```
sudo dpkg -i <PATH_TO_DEB_FILE>
sudo apt install -f
```

## Running Nebula Metrics
Nebula Metrics comes as a Systemd service that can be used with Systemctl.
The below commands document how to work with Nebula metrics. *You will likely
need sudo access for starting, stopping, and enabling the service.*
* Start Nebula Metrics: `systemctl start nebula-metrics.service`
* Stop Nebula Metrics: `systemctl stop nebula-metrics.service`
* Get the status: `systemctl status nebula-metrics.service`
* Set Nebula Metrics to start at OS boot: `systemctl enable nebula-metrics.service`

# Contributing
## Linting
* Rust: [Clippy](https://github.com/rust-lang/rust-clippy)
* TypeScript: [Eslint](https://github.com/eslint/eslint)

## Formatting
* Rust: [Rustfmt](https://github.com/rust-lang/rustfmt)
* TypeScript [Prettier](https://github.com/prettier/eslint-config-prettier)
