# Portfolio refresh — October 6, 2026

The portfolio now leads with Scott's current transition from M.S. thesis work into doctoral study and the scientific questions connecting AI, learner modeling, and educational assessment. Existing research findings and manuscript status labels were retained; this pass did not establish new research results or independently recheck journal submission status.

## Content decisions

- The homepage features the knowledge-tracing thesis, adaptive-assessment review, and Ascension as creative practice.
- Work places the two research cases first, then Ascension, the contractor credential prototype, and related accessibility/personalization prototypes.
- General data engineering and temporal retrieval projects moved to the portfolio archive. Research no longer repeats the temporal retrieval project.
- archive.html links earlier algorithm demonstrations, browser games, and data projects. No repository was formally archived or deleted, and original demo URLs remain intact.
- About now includes creative practice alongside education and service.

## Visual direction

Warm paper, dark ink, copper detailing, serif headings, a dotted notebook field, an asymmetric monogram, and a dark creative section with map-like rings. This is an initial interpretation of the user's personal style, pending their feedback. No new personal history or fictional research outcomes were added.

## Validation

- Existing suite: 9 suites, 32 tests passed.
- Seven portfolio routes checked in Edge at 1440, 390, and 320 pixels.
- Checked HTTP success, meaningful page content, image loading, horizontal overflow, clipped text, local section anchors, and browser errors.
- Mobile menus opened and closed using Escape on all seven routes.
- Followed Work → archive → heap demo successfully.
- Screenshot review found and corrected a clipped mobile hero paragraph caused by the grid's intrinsic minimum width. Repeated all browser checks after the fix; passed with no browser errors.
- git diff --check passed.

The agent-browser CLI was unavailable in the local cache. Browser checks used bundled Playwright with installed Edge. No packages were installed.

Changes are local and have not been committed, pushed, or published. Pre-existing uncommitted changes were preserved.

## Follow-up: remove game development from the profile

At the user's request, removed Ascension from Home, Work, and About, removed Unreal Engine from the About and résumé skill lists, and changed shared branding and homepage metadata from creative systems to software. The two research projects remain featured. Older browser experiments remain in the archive. Removed unused creative-section styling. Existing 32 tests passed; browser checks confirmed the four edited profile pages contain no Ascension, Unreal, action-RPG, or storytelling references.
