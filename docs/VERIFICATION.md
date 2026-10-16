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

The hierarchy and search rows below describe the original hand-built anatomy list. It was replaced by the registry anatomy tree on 16 October 2026; see the [registry tree pass](#registry-anatomy-tree-pass-16-october-2026).

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

A polish pass on 3 October 2026 re-checked the explorer in headless Chromium (SwiftShader WebGL) at 1440×900, 390×844 and 360×740 with no horizontal overflow. It changed selection to lift the chosen structure and recede the rest, widened side framing on narrow screens, kept the anatomy tree directly above the detail card with its own scroll area, raised the smallest text sizes, and changed the hint to "Scroll or pinch to zoom" as in the other organ explorers. `bun test` (6 tests), typecheck and build passed. The screenshots above were replaced with 1440×900 and 390×844 captures; before/after captures are in [screenshots/polish](screenshots/polish).

Failure scenarios are reproducible in development at `/tests/browser-fixture.html?scenario=asset`, `webgl`, `context`, or `slow`. They run the actual app with narrowly scoped browser faults. The context fixture includes its own simulation button; the WebGL fixture includes a restoration button. These fixtures are not production build entry points.

## Remaining limits

- Anatomical labels, mappings, and geometry have developer review; independent anatomist/clinical review remains pending. Source-specific gaps and ambiguities are documented in [MODEL_PROVENANCE.md](MODEL_PROVENANCE.md).
- The inspected browser reported a `THREE.Clock` deprecation warning from the React Three Fiber dependency. It did not prevent rendering. Deliberate failure fixtures also produce expected loading/context errors.
- Mobile verification used responsive browser dimensions, not a physical touchscreen device. Physical pinch gestures, screen-reader speech output, Safari/Firefox, and GPU-specific behavior were not independently tested.
- Reduced motion is implemented with no automatic model movement or camera animation and a CSS preference override. No separate OS-level reduced-motion session was tested.
- No hosted deployment, performance benchmark, diagnostic validation, or surgical/physiological simulation is claimed.

Model screenshots are adaptations of BodyParts3D / Anatomography, © DBCLS, under CC BY-SA 2.1 Japan. See [attribution](../public/models/LICENSE.txt).

## Cross-explorer consistency pass (10 October 2026)

Selection, framing and the anatomy panel now behave the same in all five OrganUI explorers (brain, heart, kidneys, liver, lungs), using the heart explorer as the reference. A selection lifts the chosen structure in its own color and ghosts the rest to 22% opacity, toned toward the canvas. Every named view is framed by `src/framing.ts`, which fits sampled surface points to the view at a shared 80% fill. The panel starts closed, opens from the header Anatomy button with focus moved into it, and Escape closes it and returns focus to that button. Checked in headless Chromium (SwiftShader WebGL) at 1440×900 and 390×844, with typecheck, tests and build passing.

## Registry anatomy tree pass (16 October 2026)

The panel's hand-built list and its search box were replaced by the OrganUI registry `anatomy-tree` component, installed with the shadcn CLI and kept unmodified. See [REGISTRY_INTEGRATION.md](REGISTRY_INTEGRATION.md).

Automated: `bun install --frozen-lockfile` from a removed `node_modules`, `bun run typecheck`, `bun test` (12 tests: the earlier state tests plus adapter mapping, validation and visibility conversion), `bun run build`, and `bun run format:check` passed.

Browser checks used Playwright with headless Chromium (SwiftShader WebGL) at 1440×900 and 390×844 against the dev server, with no console errors in either run:

| Area            | Observed result                                                                                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel           | Closed by default; the header Anatomy button opened it and moved focus into it; Escape from a tree row closed it and returned focus to the button.                                                 |
| Search          | “lingular” showed Superior and Inferior lingular with their ancestors (Both lungs › Left lung › Upper lobe).                                                                                       |
| Tree selection  | Selecting Superior lingular from the tree updated the selection chip, details card and tree row; the view label stayed “Anterior”.                                                                 |
| Visibility      | Hiding the right apical segment gave 19 of 20 groups and “Mixed” on its lobe and on Both lungs. Hiding Left lung gave 11 of 20. The mixed Both lungs row showed all lung groups again.             |
| Restore / reset | Hiding the airway tree then Restore all set every row back to Visible. Reset cleared a typed tree search and returned to the default disclosure with Both lungs selected.                          |
| 3D → tree       | A scene click (lobe mode, collapsed tree) selected Right upper lobe without changing the view label; the chip name opened the panel and the tree showed the Upper lobe row selected and disclosed. |
| Hidden picking  | After hiding Right lung from the tree, clicking the same screen point did not select right-lung tissue.                                                                                            |
| Tour            | All four stops kept the tree selection in step (Both lungs, Upper lobe, Apical, Airway tree); Finish restored the initial state.                                                                   |
| Mobile          | 390-pixel document width with no horizontal overflow; the tree stacks in the panel below the scene.                                                                                                |

Before installing the component, the existing interface was screenshotted with and without the Tailwind import; header, toolbar, chip, detail card, display controls, tour and dialog matched (no pixel differed by more than 16 of 255 per channel) after the preflight adjustments described in the integration notes. Screen-reader output was not tested; the tree's roles and keyboard behavior come from the registry component and were only exercised through Playwright.

## Registry tree update: colors and built-in reveal (16 October 2026)

The tree was reinstalled from OrganUI #12 (`d6b36d0`, served locally) and the panel adopted its new node options; see [REGISTRY_INTEGRATION.md](REGISTRY_INTEGRATION.md). Leaf rows carry their mesh color; all rows stay selectable (no `group-*` rows); the app's remount-to-reveal workaround was removed in favor of the component's built-in reveal.

Automated: `bun install --frozen-lockfile` from a removed `node_modules`, `bun run typecheck`, `bun test` (12 tests; the ancestor-disclosure test was replaced by one asserting each leaf row's color equals its scene color and no row is made unselectable), `bun run build`, and `bun run format:check` passed.

Browser checks used Playwright with headless Chromium (SwiftShader WebGL) at 1440×900 and 390×844 against the production build (`vite preview`), with no console errors in either run:

| Area            | Observed result                                                                                                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors          | With every branch open, all 20 leaf rows showed a 10-pixel swatch whose computed color equaled the mesh color of that structure, in tree order; parent rows had none.                                                                                                                                                                                 |
| Parent rows     | Clicking the Right lung label, or Enter on Left lung, selected it (chip and `aria-selected`); ArrowRight expanded it. The view label stayed "Anterior".                                                                                                                                                                                               |
| 3D → tree       | With Both lungs collapsed, a scene click selected Right middle lobe; the tree opened Both lungs › Right lung and showed Middle lobe selected and in view. On desktop, with the tree scrolled to the bottom and Right lung collapsed, a segment-mode click selected Right anterior segment; the tree opened its branch and scrolled the row into view. |
| Tour            | Starting with Both lungs collapsed, the four stops selected Both lungs, Upper lobe, Apical and Airway tree in the tree.                                                                                                                                                                                                                               |
| Search          | "lingular" showed both lingular groups with their ancestors; selecting Inferior lingular updated chip and row. A scene pick during a search keeps the search; clearing it showed the picked row selected and disclosed.                                                                                                                               |
| Visibility      | Hiding Apical gave "Mixed" on Upper lobe, Right lung and Both lungs and 19 of 20 groups; hiding Left lung gave 11 of 20; "Mixed: show Both lungs" made every row Visible again.                                                                                                                                                                       |
| Reset           | Cleared a typed search and returned to the default disclosure with Both lungs selected.                                                                                                                                                                                                                                                               |
| Panel and focus | Closed by default; opening moved focus into it; Escape from a tree row closed it and returned focus to the Anatomy button; the chip name reopened it with the picked row selected.                                                                                                                                                                    |
| Mobile          | Document width 390 pixels with no horizontal overflow.                                                                                                                                                                                                                                                                                                |

Screenshots: [anatomy.png](screenshots/anatomy.png) (desktop) and [mobile-anatomy.png](screenshots/mobile-anatomy.png), both with Right upper lobe selected and its segment rows showing their swatches.
