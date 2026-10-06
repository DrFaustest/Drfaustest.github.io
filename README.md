# Scott Faust portfolio

Static research and software engineering portfolio hosted with GitHub Pages. The public experience highlights auditable knowledge-tracing research, adaptive-assessment scholarship, applied product prototyping, military systems experience, and selected public repositories.

## Architecture

- Root HTML pages provide the primary portfolio routes.
- style.css and site.js provide shared design, navigation, accessibility, print behavior, and progressive enhancement.
- media/img/og-portfolio.png is the site-wide social preview.
- Projects/ and media/Projects/ preserve earlier algorithm visualizations and browser experiments as linked project history in archive.html. Original demo URLs remain intact.
- tests/ contains algorithm and repository-integrity tests.
- docs/AUDIT.md and docs/REDESIGN_REPORT.md record the July 2026 redesign history.

## Local setup

Requirements: Node.js 20 or newer and npm.

~~~sh
npm install
npm run dev
~~~

Open the local URL printed by the static server. Directly opening HTML files is not sufficient for pages that use JavaScript modules.

## Validation

~~~sh
npm test
npm run check
~~~

npm test runs algorithm and repository-integrity tests. npm run check runs the complete local validation sequence. The project has no compile or type-check phase because it is plain JavaScript served as static files.

## Primary routes

- / — professional positioning, accomplishments, and flagship work
- /projects.html — research foundations, an applied prototype, and related repositories
- /archive.html — earlier coursework, browser experiments, and data projects
- /research.html — thesis research, submitted scholarship, and related artifacts
- /about.html — background, education, accomplishments, and technical practice
- /resume.html — printable online résumé
- /contact.html — professional contact paths and the Formspree contact form
- /recursion.html — student-facing Python recursion explorer with Hanoi, maze-solving, and Sudoku traces, stack frames, variable inspection, and downloadable examples

## Recursion lesson

The lesson is a dependency-free browser simulation of the Python functions in `lessons/recursion/`. A highlighted line is the next line to execute; stepping changes the state and pauses at the next executable line. The sample runner is included in each downloaded script but is outside the visualized function trace.

`npm test` checks algorithm invariants and site integrity. Run `python tests/verify_recursion.py` to compare every simulated line pause and watched frame variable with real CPython for all six tower sizes, three maze presets, and five Sudoku presets. This additional check requires Python 3 and Node.js, with no third-party packages.

The teaching navigation links directly to the lesson. `recursion.html#maze` opens the maze example; `recursion.html#sudoku` opens Sudoku. Maze editing is local to the browser session; downloads contain the original sample layouts. The maze searches for a goal and permanently marks visited cells as 3 directly in the grid, without a separate visited set or path. The flood-fill homework solution is not included. Instructor documents and video are not redistributed.

## Content boundaries

- The adaptive-assessment manuscript is labeled as submitted, not published.
- Thesis claims remain bounded to the verified evaluation and do not imply mastery validity, fairness, instructional effectiveness, or universal model superiority.
- The contractor credential tracker is described as a private prototype and does not claim legal or regulatory compliance.
- Earlier learning tools and experiments are labeled as archived work and linked from a dedicated archive. Archive placement describes portfolio relevance, not repository maintenance status.

## Deployment

GitHub Pages serves the repository directly from the default branch. Keep URL paths case-correct and use forward slashes in HTML. No secrets or runtime environment variables are required by the site itself.

The contact form posts to Formspree and therefore depends on the external service and the endpoint configured in contact.html. GitHub and LinkedIn remain available if it is unavailable.
