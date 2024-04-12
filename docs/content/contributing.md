+++
title = 'Contributing to Nebula Metrics'
weight = 30
+++

## Required Tools
### Rust
* [Rust](https://www.rust-lang.org) (recommended version >= 1.75.0)
* [Cross compiler](https://github.com/SergioBenitez/homebrew-osxct/tree/master)
  and complete the below setup instructions (if not developing on Linux)
    * Run `rustup target add x86_64-unknown-linux-gnu`.
    * Create a *.cargo* directory in the root of the repository.
    * Create a file called *config.toml* in the *.cargo* directory with the below contents.
    ```toml
    [target.x86_64-unknown-linux-gnu]
    linker = "x86_64-unknown-linux-gnu-gcc" # Name of the linker binary
    strip.path = "x86_64-unknown-linux-gnu-strip" # Name of the strip binary
    ```
* [cargo-deb](https://crates.io/crates/cargo-deb)
* [Clippy (linter)](https://github.com/rust-lang/rust-clippy)
* [Rustfmt (formatter)](https://github.com/rust-lang/rustfmt)


### TypeScript
* [Node.js](https://nodejs.org/en) (recommended version >= 21.6.2)

*All other tools are defined in the package.json file in the dashboard directory,
and are automatically included when running `npm install`.*

## How to Build Nebula Metrics
* Run `cargo deb --target x86_64-unknown-linux-gnu -p monitor`.
* The packaged *.deb* file will be located in *target/x86_64-unknown-linux-gnu/debian/*.

## Guidelines
### During Development
* Lint your code with Clippy and ESLint to ensure best code practices.
    * Tip: Comment out the contents of the main function in server/build.rs to
      speed up Clippy's execution time. ***Do not forget to uncomment the file
      before packaging and committing.***
* Format your code with Rustfmt and Prettier for consistency.
* Use log messages to mark important events in the code. Logs can be accessed
through the `journalctl` tool.
* Create a *.env.development.local* file in the *dashboard* directory and create
a variable called `VITE_API_SERVER` with the value "http://<IP_TO_API>:4242".
This allows for you to develop on the web without having to constantly rebuild
and install the entire application on your development VM.

### After Development
* Write appropriate tests for your new features and make sure they work as expected.
* Manually test your new features to make sure they did not break other components.
* Document your changes. This includes but is not limited to:
    * Writing comments throughout the code.
    * Usingdoc comments for method signatures.
    * Updating the OpenAPI specification located in *docs/static/resources* for all API changes.
    * Documenting any larger feature on the website.

### Before Feature Merge
* Link the pull request to the appropriate issue(s).
* Make sure the automated tests pass.
* Get an approval from another developer.
* Merge and delete the feature branch.
