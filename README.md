![Banner](assets\Banner_logo.png)
# WikiRabbit

WikiRabbit is a small Windows desktop app for following a daily Wikipedia rabbit hole.

It runs from the Windows system tray, shows a daily or random Wikipedia article, offers two related article choices, and records the path as a visual branching tree.

## Current Features

- Windows desktop shell built with Tauri 2.
- System tray menu with open, random article, settings, and quit actions.
- Start-with-Windows setting.
- Local Windows notifications.
- Random Wikipedia article reader with title, description, image, extract, and Wikipedia link.
- Binary article exploration with two related choices.
- Persistent visual rabbit-hole tree using React Flow.
- Local SQLite storage for settings, cached article metadata, daily delivery state, and exploration history.

## Architecture Philosophy

WikiRabbit is intentionally local-first and simple. It is a demonstration app, not a production-scale platform.

The project favors:

- Clear boundaries over broad abstractions.
- Tauri/Rust for native Windows behavior.
- React/TypeScript for the user interface and product logic.
- SQLite for small local persistence.
- Public Wikipedia/Wikimedia APIs for article data.
- Focused tests for filtering and scheduling logic instead of a large test suite.

The frontend owns the main application flow: loading articles, building trails, rendering the reader, and transforming saved nodes into a React Flow tree. The Tauri layer stays thin and handles native desktop concerns such as tray behavior, notifications, autostart, window lifecycle, and plugin setup.

## Project Layout

```text
WikiRabbit/
├── src/                    # React + TypeScript app
│   ├── components/          # UI views and reusable app components
│   ├── services/            # Wikipedia, storage, scheduler, notification, tree logic
│   ├── App.tsx              # Main app state and workflow wiring
│   └── styles.css           # Desktop UI styling
├── src-tauri/               # Tauri/Rust desktop shell
│   ├── src/main.rs           # Tray, window, plugin, and native app setup
│   ├── migrations/           # SQLite schema
│   ├── capabilities/         # Tauri plugin permissions
│   └── tauri.conf.json       # Tauri app and bundle config
├── package.json              # npm scripts and frontend dependencies
└── vite.config.ts            # Vite config
```

## Development Prerequisites

Install these before running the app locally:

- Windows 10 or 11.
- Node.js and npm.
- Rust and Cargo.
- Microsoft C++ Build Tools.
- Microsoft Edge WebView2 Runtime.

The app also needs network access to Wikipedia and Wikimedia domains.

## Run For Development

Install dependencies:

```powershell
npm install
```

Run the desktop app in development mode:

```powershell
npm run tauri dev
```

This starts Vite on `127.0.0.1:1420` and opens the Tauri desktop shell. Prefer this command over browser-only Vite because the app depends on Tauri plugins for SQLite, notifications, tray behavior, autostart, and HTTP access.

Run the focused test suite:

```powershell
npm test
```

Build the frontend:

```powershell
npm run build
```

Build the Windows desktop app and installers:

```powershell
npm run tauri build
```

Successful Tauri builds produce installer output under:

```text
src-tauri/target/release/bundle/
```

## How To Use WikiRabbit

1. Launch WikiRabbit.
2. Use `Today` to view the current daily article when one is available.
3. Use `Start New Trail` or the tray menu's `Show Random Article` action to begin a rabbit-hole trail.
4. Read the article preview, then choose one of the two related article cards.
5. Continue choosing branches to grow the trail.
6. Open `Current Trail` to pan, zoom, fit, and select articles in the visual tree.
7. Use the bottom trail bar to jump back to articles on the active path.
8. Use `Settings` to adjust daily notification time, start-with-Windows, notifications, and local cleanup options.
9. Close the window to leave WikiRabbit running in the tray.
10. Use the tray menu's `Quit` action when you want to fully exit the app.

## Local Data

WikiRabbit stores app data locally in SQLite through the Tauri SQL plugin. Stored data includes settings, article metadata, daily delivery records, and exploration nodes.

The app does not use accounts, cloud sync, telemetry, private keys, or API tokens.

## Manual Validation Notes

For visual or interactive changes, test the installed Windows app, not only the dev shell:

1. Confirm launch, close-to-tray, tray open, tray random article, settings, and quit behavior.
2. Confirm random articles load with text and images when available.
3. Follow several article choices and confirm the tree expands from the correct nodes.
4. Restart the app and confirm the current article and trail are restored.
5. Toggle start-with-Windows and confirm it persists.
6. Send a test notification and click it.

Windows notification click behavior can differ between development and packaged builds, so validate notification activation from an installed MSI or NSIS build before treating it as complete.
