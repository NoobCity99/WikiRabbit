# Developers Project Log 
Agent will update as needed, to be used as a reference tool for development team. 


## Meaningful Changes of various kinds

### 2026-08-02 - First working WikiRabbit implementation

Implemented the initial WikiRabbit desktop application from `dev/BuildSpec.md`.

Technical summary:

* Scaffolded a Tauri 2 + React + TypeScript + Vite application.
* Added Tauri native shell behavior for Windows tray menu, close-to-tray, single-instance focus, notification support, autostart support, HTTP access, opener support, and SQLite access.
* Added SQLite migrations for settings, article cache/history, daily article delivery, explorations, and article nodes.
* Implemented Wikipedia random article loading, summary validation, linked article filtering, and two-choice rabbit-hole expansion.
* Implemented daily notification decision logic with once-per-day delivery tracking.
* Implemented the mockup-inspired UI with Today, Current Trail/Rabbit Hole, Settings, article reader, binary choice cards, React Flow tree, and bottom trail path.
* Added focused Vitest coverage for daily scheduler logic and Wikipedia filtering logic.
* Generated simple local application/tray icons under `src-tauri/icons`.

Verification performed:

* `npm test` passed: 2 test files, 6 tests.
* `npm run build` passed.
* `cargo check` passed from `src-tauri`.
* `npm run tauri build` passed and produced:
  * `src-tauri/target/release/bundle/msi/WikiRabbit_0.1.0_x64_en-US.msi`
  * `src-tauri/target/release/bundle/nsis/WikiRabbit_0.1.0_x64-setup.exe`

Known follow-up risks:

* Windows notification click behavior still needs manual validation from the installed app, because toast activation can differ between development and packaged builds.
* `npm audit --audit-level=critical` reported 0 vulnerabilities after the final dependency lockfile was generated.
* The app uses English Wikipedia only, as specified for the first version.


## Bug Fixes (with technical descriptions of issue & resoultion)

### 2026-08-08 - README banner rendering fix

* Corrected the README banner image reference to use a GitHub-compatible forward-slash relative path: `assets/Banner_logo.png`.

### 2026-08-02 - Tauri scaffold verification fixes

* Removed an unnecessary Rust library target from `src-tauri/Cargo.toml` because the first version uses a binary `main.rs` entrypoint.
* Added explicit bundle icon paths to `src-tauri/tauri.conf.json` after Tauri compiled the executable but failed Windows bundling without an `.ico` icon.
* Corrected npm package versions for Tauri plugins to published versions available from npm.


## Questions & Answers discussed with AGENT during Planning Sessions. 

### 2026-08-02 - Implementation assumptions

* Used npm as the package manager.
* Kept all product logic local-first and avoided accounts, sync, telemetry, updater, code signing, and Store publishing.
* Treated mockup-only Previous Trails and Favorites as out of scope for v1 because `BuildSpec.md` says no separate Library view is required.
