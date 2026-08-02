# WikiRabbit Build Specification

## Objective

Build the first working version of WikiRabbit as a standalone Windows desktop application.

The application should:

* Run in the Windows system tray.
* Start automatically when the user signs into Windows.
* Select and display a random Wikipedia article.
* Show a short article preview with an image.
* Present two related Wikipedia articles as choices.
* Record the user’s selections in a visual branching tree.

This is a RailCoding demonstration project. Prioritize a clear, functional implementation over production-scale architecture, extensive customization, or premature optimization.

## Recommended Stack

* Tauri 2
* React
* TypeScript
* Rust for native desktop behavior and backend commands
* SQLite for local persistence
* React Flow for the visual article tree
* Wikipedia and Wikimedia APIs for article data

---

# Phase 1 — Desktop Shell and Wikipedia Reader

## Goal

Create an installable Windows application that runs in the system tray and can retrieve and display one Wikipedia article.

## Desktop Requirements

Implement:

* Tauri desktop application shell.
* Windows system tray icon.
* Tray menu containing:

  * Open WikiRabbit
  * Show Random Article
  * Settings
  * Quit
* Closing the main window should hide it to the tray.
* Selecting Quit should fully terminate the application.
* Prevent multiple application instances.
* Add a Start with Windows setting.
* When launched automatically, start hidden in the tray.
* When launched manually, open the main window.

## Notification Requirements

Implement a Windows notification that includes:

* Article title.
* Short article description or extract.
* Click behavior that opens WikiRabbit to the displayed article.

The first version may use a manual notification test instead of a complete daily scheduler.

## Wikipedia Reader Requirements

Retrieve a random Wikipedia article from the main article namespace.

Reject:

* Redirects.
* Disambiguation pages.
* Articles with no meaningful introduction.
* Articles already rejected during the current request.
* Non-article namespaces.

Display:

* Article title.
* Short description when available.
* First two or three introductory paragraphs.
* Lead image or thumbnail when available.
* Link to open the complete article on Wikipedia.

Include:

* Loading state.
* Recoverable error state.
* Retry button.
* Button to request another random article.

## Local Storage

Create a local SQLite database or equivalent persistent store.

Store:

* Application settings.
* Most recently displayed article.
* Previously displayed article IDs.
* Last successful article fetch.
* Start-with-Windows preference.

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

1. The application builds and runs on Windows.
2. The tray icon remains active when the window is closed.
3. The application can be opened and exited from the tray menu.
4. Start with Windows can be enabled or disabled.
5. A random Wikipedia article can be retrieved.
6. The article preview displays text and an image when available.
7. Clicking a Windows notification opens the correct article in the app.
8. The most recent article is restored after restarting the application.

---

# Phase 2 — Daily Article and Binary Exploration

## Goal

Add the daily delivery workflow and allow the user to continue from one article to two related article choices.

## Daily Article Scheduler

Add a configurable daily notification time.

Store:

* Preferred notification time.
* Last delivery date.
* Current daily article.
* Whether the current article notification has been delivered.

Behavior:

* Deliver no more than one daily article per calendar day.
* If the computer was offline at the scheduled time, deliver the article after the next application start.
* Do not deliver duplicate notifications after restarting the app.
* Allow the user to manually request a new article without replacing the official daily article unless explicitly selected.

## Related Article Selection

For the currently displayed article:

1. Retrieve linked Wikipedia articles.
2. Filter invalid or poor candidates.
3. Select two usable choices.
4. Display both choices beneath the article preview.

Reject candidates that are:

* Redirects.
* Disambiguation pages.
* Previously visited in the current exploration.
* Non-article namespaces.
* Date or year pages when detectable.
* Titles beginning with `List of`.
* Pages without a meaningful introduction.

Prefer candidates that have:

* A useful extract.
* A short description.
* A thumbnail.
* A clear relationship to the current article.

The two choices should not be identical or near-duplicates.

## Binary Exploration Behavior

Each article presents two choices:

* Choice A
* Choice B

When the user selects one:

* Mark the selected article as visited.
* Keep the unselected article available.
* Load the selected article into the reader.
* Retrieve two new related choices.
* Add the new article and its alternatives to the current exploration.
* Prevent circular paths where practical.

Allow the user to:

* Return to previously visited articles.
* Select an earlier unchosen branch.
* Start a new exploration from a random article.
* Resume the current exploration after restarting the app.

## Data Model

Persist at minimum:

### Exploration

* ID
* Root article ID
* Created date
* Updated date
* Active node ID

### Article Node

* Internal node ID
* Wikipedia page ID
* Parent node ID
* Branch label
* Title
* Description
* Extract
* Thumbnail URL
* Canonical URL
* Visited state
* Depth
* Created date

## Phase 2 Acceptance Criteria

Phase 2 is complete when:

1. The user receives no more than one scheduled article notification per day.
2. Missed notifications are delivered after the next application start.
3. Every valid article can offer two linked article choices.
4. Choosing A or B opens that article.
5. The unchosen article remains available.
6. The user can continue making choices for multiple levels.
7. The app avoids immediately repeating visited articles.
8. The current exploration survives application restart.
9. The user can start a completely new exploration.

---

# Phase 3 — Visual Rabbit-Hole Tree

## Goal

Represent the binary exploration as an interactive visual tree while retaining the article reader.

## Tree View

Add a Rabbit Hole view using React Flow.

Display:

* Root article at the top or left.
* Child choices branching from their parent.
* Article title on each node.
* Thumbnail when available.
* Branch label A or B.
* Visited and unvisited states.
* Active article state.
* Parent-child connection lines.

## Tree Interaction

The user should be able to:

* Pan around the tree.
* Zoom in and out.
* Fit the full tree into view.
* Click any node to open its article.
* Select an unvisited choice directly from the tree.
* Return to the active article.
* Continue expanding any existing branch.

The tree should automatically lay out new nodes.

Manual node positioning is not required for the first version.

## Visual States

Use clear styling for:

* Root article.
* Current active article.
* Visited articles.
* Available but unvisited choices.
* Previously abandoned branches.
* Loading or failed nodes.

The active path from the root to the current article should be visually distinguishable.

## Application Navigation

Provide three primary views:

### Today

Displays the current daily article.

### Rabbit Hole

Displays the visual exploration tree and active article.

### Settings

Contains:

* Daily notification time.
* Start with Windows.
* Notification toggle.
* Random article quality filtering.
* Clear exploration history.
* Clear article cache.

A separate Library view is not required for the first working version.

## Error Handling

The application should fail gracefully when:

* Wikipedia is unavailable.
* An article has no usable image.
* Fewer than two valid related articles are found.
* A cached image can no longer be loaded.
* The local database cannot save a change.

Acceptable fallback behavior includes:

* Displaying a text-only article.
* Retrying with additional related links.
* Offering one valid choice and a regenerate button.
* Retaining the previously loaded article.
* Showing a clear, recoverable error message.

## Phase 3 Acceptance Criteria

Phase 3 is complete when:

1. The current exploration appears as a visual tree.
2. Each article and alternative is represented by a node.
3. Selecting an article updates both the reader and active tree node.
4. New choices expand from the correct parent.
5. Unchosen branches remain available.
6. The tree persists after restarting the application.
7. The tree can be panned, zoomed, and fitted to the window.
8. The active path is visually clear.
9. A complete daily article-to-rabbit-hole workflow can be demonstrated without developer tools.

---

# First-Version Completion Definition

The first working version is complete when a user can:

1. Install WikiRabbit on Windows.
2. Allow it to start with Windows.
3. Leave it running in the system tray.
4. Receive a daily Wikipedia notification.
5. Open the notification to view an article preview.
6. Choose between two linked articles.
7. Continue selecting new linked articles.
8. View the resulting exploration as a persistent visual tree.

# Out of Scope

Do not include unless required to complete the core workflow:

* User accounts.
* Cloud synchronization.
* Mobile or Linux versions.
* AI-generated summaries.
* AI-generated link recommendations.
* Automatic application updates.
* Microsoft Store publishing.
* Code-signing infrastructure.
* Social sharing.
* Multiple Wikipedia language editions.
* Advanced tree editing.
* PNG or PDF export.
* Production analytics.
* Telemetry.
* Large automated test suites.

# Development Guidance

* Complete each phase before beginning the next.
* Keep commits focused and phase-specific.
* Prefer existing Tauri and React libraries over custom platform code.
* Keep Wikipedia API logic isolated from UI components.
* Keep native Windows behavior isolated in the Tauri layer.
* Add only tests that protect the primary user workflow or complex filtering logic.
* Document meaningful architecture decisions in the repository.
* Avoid speculative abstractions intended for features outside this specification.
