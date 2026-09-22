# Local verification

Verified on 22 September 2026 with Bun 1.4.2 and the Codex in-app Chromium browser. This records implementation checks, not independent anatomical validation.

## Automated checks

- `bun install --frozen-lockfile` passed, including in an isolated copy with no existing `node_modules` or sibling source dependencies.
- `bun run typecheck` and `bun run build` passed. The production build includes the model, attribution, and self-hosted fonts.
- `bun test`: 5 tests passed, 17 assertions. Coverage includes the five-lobe/17-segment partition, hidden-structure recovery, isolation, reset after combined changes, and transparent-surface picking policy.
- `bun run prepare:model` reproduced the bundled 3,901,260-byte GLB from cached checksum-pinned originals. Embedded source IDs, FMA concepts, compatibility version, official mapping membership, and exclusive element ownership passed validation.
- `bun run verify:model` independently passed: 20 groups, 119 unique original elements, 120,335 vertices, 165,844 triangles, finite coordinates, valid indices, group counts, output checksum, and patient laterality.
- Reproduced output SHA-256: `b2b19e5f7473036598e3552a5835a4ebc0f55c786ddd00863cb6a170409ed346`.

## Browser checks

The final interface follows the updated Heart example: full-height warm neutral stage, collapsed anatomy panel, minimal view/zoom/reveal/reset toolbar, model information dialog, and small attribution footer.

| Area                 | Observed result                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actual model         | Both lungs, trachea, and bronchial trees rendered. Anterior patient right appears on the viewer's left. Relative alignment remains consistent across views.                                        |
| Hierarchy            | Expanded right lung and upper lobe, selected right apical segment, and checked synchronized description and breadcrumbs.                                                                           |
| Search               | “lingular” returned the two represented tissue groups. Mobile “apicoposterior” selected the left group and disclosed its two original pieces.                                                      |
| Visibility           | Segment isolation left 1 of 20 groups visible; hiding it reached 0. The empty-scene recovery, show-selected action, restore-all, and reset recovered the model.                                    |
| Picking              | Scene clicks selected right upper lobe and tissue segments in their respective modes. Trachea and right bronchial tree were selected through faded tissue in airway mode.                          |
| Reveal               | Inspected the 12% surface reveal from anterior, posterior, and lateral views. Slider keyboard input reached 0%; reset returned to opaque surfaces. Interior source faces and seams remain visible. |
| Camera               | Named anterior, posterior, left lateral, and right lateral views, keyboard rotation, zoom controls, and reset worked. Camera-menu keyboard navigation selected a view and returned focus.          |
| Tour                 | Completed all four stops: whole lungs, right upper lobe, isolated right apical segment, and airway reveal. Finish restored the initial state.                                                      |
| Mobile               | Inspected a narrow viewport with no horizontal document overflow. Panel opening, search, selection, model notes, isolation, and “View in 3D” worked.                                               |
| Dialog               | Model scope and license content were reachable; Escape closed the dialog and returned focus to its trigger. The background is inert while it is open.                                              |
| Loading              | Delayed model loading showed a named progress bar and loading status, then rendered successfully.                                                                                                  |
| Missing model        | A fixture returned one 404. The retry message appeared; ordinary anatomy search and descriptions remained usable. Retry loaded the model.                                                          |
| No WebGL             | A fixture returned no WebGL context. An explicit fallback appeared. Restoring graphics support and retrying rendered the actual model.                                                             |
| Context interruption | A synthetic `webglcontextlost` event showed a recovery message. Retry rebuilt the canvas and rendered both lungs. This does not emulate a physical GPU/driver failure.                             |

Desktop layouts were inspected at 1280×720 and 1280×800. The final mobile screenshot was captured at a verified 390×844 CSS viewport with a 390-pixel document width and no horizontal overflow. See [desktop screenshot](screenshots/desktop.png) and [mobile screenshot](screenshots/mobile.png).

Failure scenarios are reproducible in development at `/tests/browser-fixture.html?scenario=asset`, `webgl`, `context`, or `slow`. They run the actual app with narrowly scoped browser faults. The context fixture includes its own simulation button; the WebGL fixture includes a restoration button. These fixtures are not production build entry points.

## Remaining limits

- Anatomical labels, mappings, and geometry have developer review; independent anatomist/clinical review remains pending. Source-specific gaps and ambiguities are documented in [MODEL_PROVENANCE.md](MODEL_PROVENANCE.md).
- The inspected browser reported a `THREE.Clock` deprecation warning from the React Three Fiber dependency. It did not prevent rendering. Deliberate failure fixtures also produce expected loading/context errors.
- Mobile verification used responsive browser dimensions, not a physical touchscreen device. Physical pinch gestures, screen-reader speech output, Safari/Firefox, and GPU-specific behavior were not independently tested.
- Reduced motion is implemented with no automatic model movement or camera animation and a CSS preference override. No separate OS-level reduced-motion session was tested.
- No hosted deployment, performance benchmark, diagnostic validation, or surgical/physiological simulation is claimed.

Model screenshots are adaptations of BodyParts3D / Anatomography, © DBCLS, under CC BY-SA 2.1 Japan. See [attribution](../public/models/LICENSE.txt).
