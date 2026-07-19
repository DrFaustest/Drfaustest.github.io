# Scott Faust portfolio

Static portfolio and interactive computer-science learning lab hosted with GitHub Pages. The site presents research interests, selected software projects, and browser-based demonstrations without a framework or production build step.

## Architecture

- Root HTML pages provide the main portfolio routes.
- `style.css` and `site.js` provide shared design, navigation, accessibility, and progressive enhancement.
- `Projects/DataStructuresVisualizer/` contains the maintained learning lab and pure algorithm libraries.
- `Projects/Sudoku/`, `Projects/HeapVis/`, and `Projects/advanced_algo/` contain maintained demonstrations.
- `media/Projects/` contains older demonstrations and archived experiments. These remain available for source history but are not all presented as finished work.
- `tests/` contains Jest unit and repository-integrity tests.
- `docs/AUDIT.md` records the pre-redesign baseline and implementation decisions.

## Local setup

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by the static server. Directly opening HTML files is not sufficient for pages that use JavaScript modules.

## Validation

```sh
npm test
npm run check
```

`npm test` runs algorithm and repository-integrity tests. `npm run check` runs the complete local validation sequence. The project has no compile or type-check phase because it is plain JavaScript served as static files.

## Route overview

- `/` — focused home page and featured work
- `/projects.html` — maintained projects plus archived experiments
- `/research.html` — research interests and linked public artifacts
- `/about.html` — background, education, and technical approach
- `/contact.html` — contact paths and third-party contact form
- `/Projects/DataStructuresVisualizer/` — learning-lab hub
- `/Projects/DataStructuresVisualizer/linear-structures.html` — arrays, linked lists, stacks, and queues
- `/Projects/DataStructuresVisualizer/tree-structures.html` — BST, AVL, and red-black trees
- `/Projects/DataStructuresVisualizer/hash-tables.html` — collision handling and probing
- `/Projects/DataStructuresVisualizer/graph-structures.html` — graph construction and traversal
- `/Projects/DataStructuresVisualizer/sorting-algorithms.html` — step-based sorting algorithms
- `/Projects/HeapVis/` — binary heap operations
- `/Projects/Sudoku/` — constraint-solving demonstration
- `/Projects/advanced_algo/Partision/` — partitioning-problem comparison

## Learning-lab architecture

Pure algorithm implementations live in `Projects/DataStructuresVisualizer/js/lib/` so they can be tested without a browser. Visualizer modules render structure-specific DOM or SVG views. `js/core.js` owns shared playback, pseudocode, counters, announcements, speed, cancellation, and teardown. `js/concepts.js` owns concise educational reference material displayed by category pages.

To add a learning tool:

1. Add a pure, side-effect-free implementation under `js/lib/`.
2. Add deterministic step objects or snapshots for every animated operation.
3. Add unit tests under `tests/`.
4. Add the renderer under `js/` and register it in the appropriate router.
5. Add concept metadata in `js/concepts.js`, including invariants, complexity, uses, limitations, and representation notes.
6. Add or update the category card and route documentation.
7. Run `npm run check` and verify keyboard, reduced-motion, mobile, and reset behavior.

## Deployment

GitHub Pages serves the repository directly from the default branch. Keep URL paths case-correct and use forward slashes in HTML. No secrets or runtime environment variables are required by the site itself.

The contact form posts to Formspree and therefore depends on that external service and the endpoint currently configured in `contact.html`. The portfolio remains useful if that service is unavailable because GitHub and LinkedIn contact paths are also provided.

## Known limitations

- Deterministic replay is complete for sorting and used where maintained tools expose step playback; some direct-manipulation structure operations still update immediately.
- SVG and canvas demonstrations provide textual instructions and status, but do not yet expose every visual edge or animation state as a full screen-reader data model.
- Legacy experiments under `media/Projects/` retain varied internal architectures and are intentionally labeled archived or experimental.
- No résumé or publication list is included because neither artifact is present in this repository.
- Third-party links and the contact endpoint require network access.
