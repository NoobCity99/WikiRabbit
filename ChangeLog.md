# CHANGE LOG FOR PROJECT X
  Agent will update this as needed, inputing changes in the catagory below that suits the change best. You should copy / paste necessary changes to your latest release notes as needed. 



## Feature Updates

### 2026-08-02

* Added first working WikiRabbit Windows desktop app.
* Added tray menu, close-to-tray behavior, single-instance handling, autostart setting, notifications, and installer build output.
* Added random Wikipedia article reader with image/extract display, retry/random controls, and external Wikipedia links.
* Added daily article delivery tracking and notification scheduling logic.
* Added binary rabbit-hole exploration with persistent article choices.
* Added visual rabbit-hole map using React Flow.
* Added Settings view for daily time, autostart, notifications, quality filtering, clearing trails, and clearing cached articles.



## Backend Process Changes

### 2026-08-02

* Added local SQLite persistence for settings, articles, article history, daily delivery records, explorations, and article nodes.
* Added Wikipedia API service for random article lookup, page summaries, linked-page discovery, and candidate filtering.
* Added Windows installer bundling through Tauri MSI and NSIS outputs.



## Bug Fixes

