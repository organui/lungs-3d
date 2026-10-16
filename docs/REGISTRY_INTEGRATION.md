# Anatomy-tree registry integration

The Anatomy panel uses the OrganUI registry item `anatomy-tree`. The installed source is kept in version control; runtime and ordinary setup do not contact any registry.

## Exact installation

Reinstalled on 16 October 2026 with the shadcn CLI:

```sh
REGISTRY_URL=http://127.0.0.1:4411 bunx shadcn@4.21.0 add http://127.0.0.1:4411/anatomy-tree.json -y -o
```

This install is the item from OrganUI pull request #12 (branch commit `d6b36d0`), which adds the optional `color` and `selectable` node fields and built-in reveal of the selected row. #12 was not merged at install time. The build sandbox's network policy blocks `organui.com` and `ui.shadcn.com`, so the public URL (`https://organui.com/r/anatomy-tree.json`) could not be used: a local static server on `127.0.0.1:4411` served the registry artifact built from that commit, plus shadcn's `colors/neutral.json` fetched from the shadcn GitHub repository, and `REGISTRY_URL` pointed the CLI's own registry lookups at it. **After #12 merges, re-verify against `https://organui.com/r/anatomy-tree.json`**: reinstalling from it should produce the same file (same checksum below) if the published item matches `d6b36d0`.

The first install (same day, OrganUI `master` commit `5e20c41`, served JSON `f519cf85…`, installed file `39b29446…`) predated these options.

Provenance at install time:

| Artifact                                     | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Served `anatomy-tree.json`                   | `32fbc477ece5f02ac135dbf0a5b4c059c37fc2ca9abc8982641b55c080cc9b30` |
| Embedded source (`files[0].content`)         | `cb0ebd637b64a9813ba1139560315024b315580ad04e5df6eca3b3d1bb4844c0` |
| Tracked `src/components/ui/anatomy-tree.tsx` | `dc14798adfbdcaef505cbe05e2ca92a6a3aae6164465d06e8d4d99cd415efab2` |

The item declares `@base-ui/react@^1.8.0`. The CLI rewrote the existing exact pin to that range in `package.json`; it was set back to exactly `1.8.0` like the other dependencies, and `bun install` left the text `bun.lock` unchanged. The project uses React 19.2.8, TypeScript 7.0.2, Vite 8.3.0, Tailwind CSS 4.1.18 (`tailwindcss` + `@tailwindcss/vite`) and shadcn's Base UI consumer shape (`components.json`).

## Installed-source differences

The only difference from the embedded source is that the shadcn CLI removed the leading `"use client"` directive and its blank line for this non-RSC Vite target (`"rsc": false`). No behavior, markup, API, state or class changed. The file is listed in `.prettierignore` and is never hand-edited, so its checksum stays stable.

The `@/* -> src/*` alias was added to `tsconfig.json` and `vite.config.ts` before installing, so the CLI placed the file directly at `src/components/ui/anatomy-tree.tsx`.

## API used

- `data`: two roots built from the app's anatomy (`src/anatomy.ts`);
- `selectedId` / `onSelectionChange`: the app's single controlled `state.selected`;
- `visibility` / `onVisibilityChange`: a controlled map keyed by **leaf** IDs; missing means visible;
- `defaultExpandedIds`: initial disclosure (Both lungs open);
- `label` (`"Lung anatomy"`) and `className`;
- node `color`: every leaf row (the 17 segment groups and 3 airways) carries the same color its scene mesh is drawn in (`AnatomyNode.color` in `src/anatomy.ts`), shown by the component as a decorative swatch. Parent rows have none;
- node `selectable`: not set. Every parent row is a real, selectable structure (see Decisions), so all rows keep the default `true`;
- built-in reveal: when `selectedId` changes to a row that is not shown, the component expands its ancestors and scrolls the row into view once.

Search and expansion stay internal to the component.

## Application adapter

Scene-specific logic lives in `src/anatomy-adapter.ts`; the component stays generic.

The panel previously showed two separate parts: the lung list (Both lungs → Right/Left lung → lobes → segment groups) and the airway list. They map to the tree's two roots:

| Tree root (ID)          | Children                                                      | Scene leaves (GLB mesh names)                    |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Both lungs (`lungs`)    | Right lung `FMA7309` → 3 lobes; Left lung `FMA7310` → 2 lobes | 17 segment tissue groups (`FMA7338` … `FMA7380`) |
| Airway tree (`airways`) | Trachea, Right bronchial tree, Left bronchial tree            | `FMA7394`, `FMA26661`, `FMA26662`                |

Tree IDs are the application's own structure IDs, so selection needs no translation. Every parent row is an existing, selectable structure in the app with its own description; the lung → lobe → segment relations are the BodyParts3D PART-OF relations documented in [MODEL_PROVENANCE.md](MODEL_PROVENANCE.md). No `group-*` interface rows were added, because none were needed. Placing the airway tree as a separate root, as the old panel did, implies no containment between airways and lung tissue. Labels use each structure's short name; search shows matches with their ancestors, so "Upper lobe" stays unambiguous.

The adapter provides:

- `anatomyTree`, built from the existing `nodes`/`children` data, with each leaf's mesh color;
- `sceneIdsForNode`, mapping any row to its descendant scene leaves (tested equal to the app's `leafIds`);
- `normalizeVisibility`, `visibilityFromHidden` and `hiddenFromVisibility`, converting between the tree's leaf map and the app's `hidden` list;
- `assertAnatomyMapping`, which runs at import and throws on missing, unknown or duplicate leaves.

`tests/anatomy-adapter.test.ts` covers these with the repository's `bun test` runner.

## Decisions

**Group selection.** The app already supported selecting non-leaf structures cleanly: selecting a lung, lobe, Both lungs or Airway tree highlights all of its leaves through `emphasis`, shows its details card and breadcrumbs, and drives Isolate/Hide. So every tree row, parent or leaf, is selectable and writes `state.selected`. Selecting a whole-organ row (Both lungs or Airway tree) leaves every structure at its own color, as before.

**Visibility.** Tree toggles write the reducer's `hidden` list through a `setHidden` action; Isolate, Hide, Restore all, the tour and reset keep writing the same list, and the tree reads it back on every render. Parent rows show the component's derived Visible / Hidden / Mixed state. As before, selecting a structure (from tree, scene or breadcrumbs) makes its hidden parts visible again.

**Keeping list and scene in sync.** The component's built-in reveal discloses 3D picks and tour stops: a selection whose branch is collapsed opens its ancestors, keeps every branch the user opened, and scrolls the row into view in the panel's scroll area. The app's earlier workaround (remounting the tree with the selection's ancestors added to `defaultExpandedIds`, and the adapter's `expansionFor`) was removed. One difference: the old remount also cleared a search that excluded the selection; the component keeps the search, and the row appears, already disclosed, once the search is cleared.

**Reset.** Reset bumps the tree's `key` and restores the default disclosure, which clears the component's internal search and expansion together with the app's selection, visibility, tour and camera.

**Picking.** Hidden structures are not rendered, so they cannot be picked or block surfaces behind them; this was already true and was rechecked in the browser.

**Colors.** The old list's colour dots return as the component's swatches, from the same per-structure colours the scene uses. No app CSS draws them.

**Removed.** The hand-built rows, the separate search box with its query state and result list, the Both lungs shortcut button, and their CSS. The old search also matched FMA IDs and source tissue IDs; the registry search matches labels only.

## Theme setup

`src/styles.css` starts with `@import "tailwindcss"` and defines shadcn variables (`--background`, `--foreground`, `--muted`, `--accent`, `--border`, `--ring` and the rest) from the explorer's warm neutral palette, mapped with `@theme inline`. The app's old `--muted` text-color variable was renamed `--muted-ink` to free the shadcn name.

As in the kidneys explorer, the app's base resets moved into `@layer base`, after Tailwind's preflight, so registry utilities still win and the app's component styles stay unlayered. A few preflight defaults the existing CSS relied on are restored in that layer: normal `line-height` on `html`, user-agent heading sizes and weights, inline SVG icons, and `legend` padding. Screenshots of the header, toolbar, chip, detail card, display controls, tour and dialog before and after the Tailwind import were compared; no pixel differed by more than 16 of 255 per channel. `.registry-tree` rules then adapt the tree to the panel's type scale, spacing and pill buttons without touching the component.

## Friction and follow-up

No registry defect blocked the integration and the component was not forked. Observations for other consumers:

1. The public registry hosts were unreachable from the build sandbox; a local server for the built registry plus `REGISTRY_URL` worked with the unmodified CLI.
2. The CLI writes the item's dependency range (`^1.8.0`) over an existing exact pin, also with `-o`; re-pin afterwards if the project pins exactly.
3. Tailwind's preflight changes line height, headings, SVG display and legend padding for an app not written against it; compare before/after screenshots.
4. Search matches labels only; there is no hook for aliases such as source IDs.
5. Built-in reveal does not clear a search that excludes the newly selected row, so the row stays filtered out until the search is cleared.

Resolved by OrganUI #12 (`d6b36d0`): revealing a selection made outside the tree (formerly a remount workaround) and per-row decoration (formerly no colour dots in the list).
