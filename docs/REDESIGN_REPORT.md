# Portfolio redesign report

Date: 2026-07-19

Working copy: `D:\.Dev\Drfaustest.github.io`

## Outcome

The portfolio was rebuilt as a responsive multi-page static site while preserving the existing GitHub Pages architecture and useful project code. The result has a clearer public information architecture, an evidence-bounded research narrative, an explicit project-status system, and a coordinated Data Structures Learning Lab.

No publication list, résumé download, institution name, deployment claim, empirical research result, or credential was added without evidence already present in the repository. The contact page explicitly records the absence of a résumé artifact rather than publishing a placeholder.

## Initial problems

- The portfolio was a single long page that mixed biography, education, research, skills, projects, and contact information.
- Project maturity was not visible, so active tools, prototypes, experiments, and archived work appeared equivalent.
- Five Data Structures Visualizer category pages contained editor-export artifacts.
- The featured heap project had an empty script in its public route while a functioning duplicate lived under `media/`.
- Graph tests were outside the configured Jest roots and therefore were not being run.
- There were no repository-wide local-link, page-structure, accessibility, or browser-interaction checks.
- Deterministic playback was incomplete and inconsistently described.
- Several legacy projects used unrelated visual styles and stale one-page links.
- The home-page portrait was a 1.44 MB PNG and dominated Largest Contentful Paint.

The complete evidence and route inventory is in `docs/AUDIT.md`.

## Design and architecture decisions

- Kept the existing vanilla HTML, CSS, and ES-module architecture so the site remains compatible with GitHub Pages and easy to maintain without a framework build.
- Split the public site into Home, Work, Research, Learning Lab, About, Contact, and 404 routes.
- Introduced a warm editorial design system: paper and surface neutrals, deep ink, teal as the primary action color, restrained status colors, a Georgia display face, system body text, consistent spacing, cards, controls, focus indicators, and responsive layouts.
- Added a mobile navigation menu, skip links, clear current-page states, touch-friendly controls, reduced-motion behavior, and textual explanations that do not rely on color alone.
- Added explicit project labels: maintained, prototype, experimental, and archived.
- Added a compact legacy status shell to older demos rather than rewriting or falsely presenting them as maintained work.
- Added responsive WebP portrait assets. The selected browser asset dropped from 1.44 MB to 27 KB at desktop size and 10 KB at mobile size.
- Added a local SVG favicon to eliminate the browser's missing-resource error.

## Public site architecture

| Route | Purpose |
| --- | --- |
| `/index.html` | Positioning, selected work, research direction, and working principles |
| `/projects.html` | Filterable project inventory with maturity labels |
| `/research.html` | Evidence-bounded research interests and repository-backed prototypes |
| `/about.html` | Background, education evidence, strengths, and values |
| `/contact.html` | GitHub, LinkedIn, and the existing Formspree contact path |
| `/Projects/DataStructuresVisualizer/` | Learning Lab catalog and capability map |
| `/Projects/HeapVis/` | Maintained binary heap explorer |
| `/Projects/Sudoku/` | Maintained Sudoku constraint solver |

## Data Structures Learning Lab

The former visualizer landing page is now a learning hub organized by representation and operation.

| Workspace | Supported behavior | Playback model |
| --- | --- | --- |
| Linear structures | Array, linked list, stack, and queue operations | Direct updates; cancellable searches where applicable |
| Trees | BST, AVL, and red-black insertion, search, traversal, and deletion where supported | Direct updates with structure-specific visuals |
| Hash tables | Chaining and open addressing, collision handling, deletion, rehashing, and load state | Direct updates |
| Graphs | Directed/undirected construction, BFS, DFS, Dijkstra, and path display | Direct and timed traversal state |
| Sorting | Bubble, insertion, merge, and quick sort | Deterministic previous/next/play/pause/reset |
| Binary heaps | Min/max heap insert, extract, update, delete, and build | Animated operation queue with tree and array views |

The shared sorting engine now treats generated steps as the source of truth. Previous and next reconstruct exact state, counters are recalculated from applied steps, reset restores the original array, speed is user-controlled, keyboard stepping is available, and active pseudocode is synchronized with the operation.

Every primary workspace includes a concept reference covering defining rules, complexity, use cases, tradeoffs, common mistakes, and how the visualization maps to the underlying structure.

## Project refinements

- Reconnected the public Binary Heap Explorer to the functioning implementation and made the public route canonical.
- Reframed Sudoku as a constraint-propagation and MRV-backtracking demonstrator, preserved playability, and repaired Developer View visibility.
- Reduced the Advanced Algorithms page to the partition experiment that actually exists; removed the unsupported “coming soon” presentation.
- Repaired stale portfolio links in the partition demo.
- Added a shared, fixed status/back-to-inventory shell to AVL Tree, Ball Pit, Battleship, Graphs, Job Scheduling, Pegish, Rock Paper Scissors, Space Invaders, Live Look Omaha, and Partition.
- Preserved source and media assets for historical projects instead of deleting evidence-bearing work.

## Verification

### Automated tests

`npm run check` completes successfully:

- 9 test suites passed.
- 30 tests passed.
- Sorting coverage includes empty arrays, single values, duplicates, negatives, and input non-mutation.
- Hash coverage includes collisions, negative keys, deletion, tombstone reuse, and full-table behavior.
- Sudoku coverage includes valid solving, preservation of givens, and contradictory-grid rejection.
- Existing BST, AVL, red-black tree, linked-list, BFS, DFS, and Dijkstra tests pass.
- Repository integrity tests confirm deployment-safe file-case resolution, public document structure, and removal of editor artifacts and stale anchors.

`git diff --check` is used as the final whitespace check.

### Browser interaction checks

The site was served locally and exercised in headless Microsoft Edge at desktop and 390-pixel mobile widths.

- Project filters expose only cards matching the selected status.
- The linear-structure router changes both the visualizer and concept reference from Array to Queue.
- Sorting generated 641 deterministic steps for the tested sample; Next advanced from step 0 to 1 and Previous restored step 0 and its counters.
- Heap insertion added value 42 to both the operation log and array representation.
- Sudoku rendered 81 cells, generated a medium puzzle with 41 fixed clues in the tested run, and exposed the Developer View controls.
- Graph interaction created three visible vertices.
- Home, Work, Learning Lab, Sorting, Heap, and Sudoku had no page-level horizontal overflow at 390 pixels.
- No reproducible page errors or failed route resources remained after adding the favicon.

### Accessibility

An Axe WCAG 2 A/AA and WCAG 2.1 A/AA audit was run against 15 primary routes. The initial audit identified slightly low muted-text contrast, low-contrast playback panel labels, unlabeled Sudoku cells, an unlabeled hash strategy selector, and non-focusable scrollable pseudocode regions. Those issues were corrected. The final audit reported zero violations on all 15 routes.

### Lighthouse

Lighthouse 12.8.2 was run against the local static server in headless Edge after optimization.

| Route | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home | 100 | 100 | 100 | 100 | 1.35 s | 0 | 0 ms |
| Learning Lab | 100 | 100 | 100 | 100 | 1.20 s | 0 | 0 ms |

The Lighthouse CLI emitted a Windows temporary-directory cleanup warning after writing each JSON report. The reports were complete and parseable; the warning was outside the site runtime.

## Remaining limitations

- Full deterministic replay is implemented for sorting. Several structure workspaces intentionally use immediate state changes or timed traversal instead of a universal replay engine.
- Canvas and SVG visuals have textual reference material and accessible controls, but they do not serialize every edge, coordinate, or transient animation state for screen readers.
- Legacy projects remain varied in code quality, responsiveness, and input model. Their status shell makes that boundary visible without rewriting historical source.
- The contact form depends on the configured third-party Formspree endpoint. GitHub and LinkedIn remain available if it is unavailable.
- Repository evidence does not include a résumé file or publication list, so neither is presented.
- Lighthouse was measured on a local static server. GitHub Pages caching and compression can change production transfer timings.

## Recommended next steps

1. Add deterministic replay to graph traversal and tree operations if those tools become active teaching products.
2. Add full textual state serialization for SVG/canvas diagrams when screen-reader parity becomes a delivery requirement.
3. Replace or retire the heaviest legacy media, especially the archived game soundtrack, if repository size becomes a concern.
4. Add a CI workflow that runs `npm run check` and a scheduled browser accessibility audit.
5. Add publication and résumé routes only when verified source artifacts are committed.

## Deployment status

The redesign is implemented and verified in the local repository. It has not been committed, pushed, or deployed as part of this work.
