use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn main() {
    println!(
        "cargo:rerun-if-changed={:?}",
        fs::canonicalize("../")
            .expect("Parent directory should exist")
            .to_str()
            .unwrap()
    );
    let dashboard_dir: PathBuf = fs::canonicalize("../dashboard/").expect("Dashboard should exist");
    let assets_dir: PathBuf = fs::canonicalize("../assets/").expect("Assets should exist");

    // Build the static website
    Command::new("npm")
        .current_dir(&dashboard_dir)
        .arg("run")
        .arg("build")
        .spawn()
        .expect("Should be able to build the static website");

    // Copy its contents over to the assets folder
    Command::new("cp")
        .arg("-r")
        .arg(dashboard_dir.join("dist/."))
        .arg(assets_dir.join("web"))
        .spawn()
        .expect("Should be able to copy the static website into the assets folder");
}
