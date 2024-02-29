use std::fs;
use std::path::PathBuf;
use std::process::{Command, ExitStatus};

fn main() {
    // println!(
    //     "cargo:rerun-if-changed={:?}",
    //     fs::canonicalize("../")
    //         .expect("Parent directory should exist")
    //         .to_str()
    //         .unwrap()
    // );
    // let dashboard_dir: PathBuf = fs::canonicalize("../dashboard/").expect("Dashboard should exist");
    // let assets_dir: PathBuf = fs::canonicalize("../assets/").expect("Assets should exist");

    // let ci_status: ExitStatus = Command::new("npm")
    //     .current_dir(&dashboard_dir)
    //     .arg("ci")
    //     .status()
    //     .expect("Should be able to run npm i");
    // assert!(ci_status.success());

    // // Build the static website
    // let build_status: ExitStatus = Command::new("npm")
    //     .current_dir(&dashboard_dir)
    //     .arg("run")
    //     .arg("build")
    //     .status()
    //     .expect("Should be able to build the static website");
    // assert!(build_status.success());

    // // Copy its contents over to the assets folder
    // let _: ExitStatus = Command::new("rm")
    //     .arg("-rf")
    //     .arg(assets_dir.join("web"))
    //     .status()
    //     .expect("Should run the command to remove assets/web");

    // let cp_status: ExitStatus = Command::new("cp")
    //     .arg("-r")
    //     .arg(dashboard_dir.join("dist/."))
    //     .arg(assets_dir.join("web"))
    //     .status()
    //     .expect("Should be able to copy the static website into the assets folder");
    // assert!(cp_status.success());
}
