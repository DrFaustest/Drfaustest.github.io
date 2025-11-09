# improvementNotes

## Section 1 – Issues by Severity

### Critical
- `index.html`: Profile photo `img` uses backslashes in the `src` attribute (`media\img\Profile.JPGcropped.JPG`), which GitHub Pages serves literally. The request becomes `media%5Cimg%5C...`, so the headshot 404s in production and the hero layout collapses around the missing asset.
- `index.html`: Contact form submission always reports failure. Formspree responds with a 303 redirect when JSON is posted without an `Accept: application/json` header, so `response.ok` is false and the UI shows "Failed to send message" even when the message is delivered.
- `Projects/DataStructuresVisualizer/index.html`: `<footer>` is never closed. Browsers auto-correct by hoisting the closing tags, which can drop the footer styling and accidentally wrap the module `<script>` tags inside the footer, breaking layout in Safari and some mobile browsers.

### High
- `Projects/DataStructuresVisualizer/js/graph.js`: Every navigation back to the graph visualizer attaches a new `resize` handler without removing prior listeners. After a few toggles the handler fires N-times per resize and causes noticeable lag on laptops.
- `Projects/DataStructuresVisualizer/js/bst.js`: Adds a global `resize` listener on each render and never cleans it up. Switching visualizers repeatedly produces stacked listeners that keep referencing detached DOM nodes.

### Medium
- `index.html`: Project cards use `div` with `onclick` only, making them unreachable via keyboard/screen readers and causing double navigation because a nested `<a>` also exists.
- Global styling (`style.css`) animates the background gradient indefinitely. Combined with long text blocks this fails WCAG 2.3.3 (animation from interactions) unless a pause toggle or reduced-motion handling is added.

### Low
- Legacy `Projects/DataStructuresVisualizer/script.js` is still checked in at ~1,100 lines but unused; keeping it bloats the repo and confuses contributors.
- Several visualizer buttons rely on bare `prompt()` dialogs (e.g., weighted edges, hash-table rehash) which blocks the UI and is inconsistent with the polished design elsewhere.

## Section 2 – Improvement Process Timeline
- **Week 1 – Critical fixes**
  - Correct profile image pathing and close the orphaned footer tag.
  - Patch the Formspree fetch headers and verify 200 response handling.
  - Regression-test the landing page on desktop and mobile after fixes.
- **Week 2 – High-severity cleanup**
  - Refactor graph/BST visualizers to register/unregister `resize` handlers via an initialization/dispose pattern.
  - Add automated smoke tests for switching between visualizers to prevent listener leaks.
- **Week 3 – Accessibility & UX polish**
  - Convert project tiles to semantic anchors/buttons with focus styles.
  - Honor `prefers-reduced-motion` in `style.css` and/or add animation toggles.
  - Replace blocking prompts with modal or in-panel inputs for edge weights and hash operations.
- **Week 4 – Repository hygiene**
  - Remove or archive the legacy monolithic `script.js` file.
  - Update documentation to reflect module-based architecture and new UX flows.
