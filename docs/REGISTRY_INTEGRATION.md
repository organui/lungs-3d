# Anatomy-tree registry integration

The Anatomy panel uses the OrganUI registry item `anatomy-tree`. The installed source is kept in version control; runtime and ordinary setup do not contact any registry.

## Exact installation

Installed on 2026-10-16 with the shadcn CLI:

```sh
REGISTRY_URL=http://127.0.0.1:4410 bunx shadcn@4.21.0 add http://127.0.0.1:4410/anatomy-tree.json -y
```

The build sandbox's network policy blocks `organui.com` and `ui.shadcn.com`, so the public URL (`https://organui.com/r/anatomy-tree.json`) could not be used. Instead, a local static server on `127.0.0.1:4410` served the registry artifact built from the OrganUI repository at `master` commit `5e20c41`, plus shadcn's `colors/neutral.json` fetched from the shadcn GitHub repository. `REGISTRY_URL` points the CLI's own registry lookups at that server. The item content is what the public registry would serve for that commit; reinstalling from `https://organui.com/r/anatomy-tree.json` should produce the same file if the published item has not changed.

Provenance at install time:

| Artifact                                     | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Served `anatomy-tree.json`                   | `f519cf85a68142cb7a054f6b2472649d0dec188c5f2381d4315f12f631874a8e` |
| Embedded source (`files[0].content`)         | `65a226acc9c873559913611b4fadee51935e955ac63dcc64a8dc5bee2d12e821` |
| Tracked `src/components/ui/anatomy-tree.tsx` | `39b294468f2fd06bb81b8c56f485828f941ddfc9065ea5c7c07fdf19582d1842` |

The item declares `@base-ui/react@^1.8.0`. The CLI wrote that range into `package.json`; it was then pinned to exactly `1.8.0` like the other dependencies and `bun install` refreshed the text `bun.lock`. The project uses React 19.2.8, TypeScript 7.0.2, Vite 8.3.0, Tailwind CSS 4.1.18 (`tailwindcss` + `@tailwindcss/vite`) and shadcn's Base UI consumer shape (`components.json`).

## Installed-source differences

The only difference from the embedded source is that the shadcn CLI removed the leading `"use client"` directive and its blank line for this non-RSC Vite target (`"rsc": false`). No behavior, markup, API, state or class changed. The file is listed in `.prettierignore` and is never hand-edited, so its checksum stays stable.

The `@/* -> src/*` alias was added to `tsconfig.json` and `vite.config.ts` before installing, so the CLI placed the file directly at `src/components/ui/anatomy-tree.tsx`.

## API used

- `data`: two roots built from the app's anatomy (`src/anatomy.ts`);
- `selectedId` / `onSelectionChange`: the app's single controlled `state.selected`;
- `visibility` / `onVisibilityChange`: a controlled map keyed by **leaf** IDs; missing means visible;
- `defaultExpandedIds`: initial disclosure (Both lungs open);
- `label` (`"Lung anatomy"`) and `className`.

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

- `anatomyTree`, built from the existing `nodes`/`children` data;
- `sceneIdsForNode`, mapping any row to its descendant scene leaves (tested equal to the app's `leafIds`);
- `normalizeVisibility`, `visibilityFromHidden` and `hiddenFromVisibility`, converting between the tree's leaf map and the app's `hidden` list;
- `expansionFor`, the ancestors to disclose for a selection;
- `assertAnatomyMapping`, which runs at import and throws on missing, unknown or duplicate leaves.

`tests/anatomy-adapter.test.ts` covers these with the repository's `bun test` runner.

## Decisions

**Group selection.** The app already supported selecting non-leaf structures cleanly: selecting a lung, lobe, Both lungs or Airway tree highlights all of its leaves through `emphasis`, shows its details card and breadcrumbs, and drives Isolate/Hide. So every tree row, parent or leaf, is selectable and writes `state.selected`. Selecting a whole-organ row (Both lungs or Airway tree) leaves every structure at its own color, as before.

**Visibility.** Tree toggles write the reducer's `hidden` list through a `setHidden` action; Isolate, Hide, Restore all, the tour and reset keep writing the same list, and the tree reads it back on every render. Parent rows show the component's derived Visible / Hidden / Mixed state. As before, selecting a structure (from tree, scene or breadcrumbs) makes its hidden parts visible again.

**Keeping list and scene in sync.** After each selection change, if the selected row is not rendered (its branch collapsed, or a search excludes it), the tree is remounted with that row's ancestors added to `defaultExpandedIds`. This discloses 3D picks and tour stops. It clears a search in progress only in that case, and it keeps branches the app has disclosed before, but not ones the user opened manually.

**Reset.** Reset bumps the tree's `key` and restores the default disclosure, which clears the component's internal search and expansion together with the app's selection, visibility, tour and camera.

**Picking.** Hidden structures are not rendered, so they cannot be picked or block surfaces behind them; this was already true and was rechecked in the browser.

**Removed.** The hand-built rows, the separate search box with its query state and result list, the Both lungs shortcut button, and their CSS. The old search also matched FMA IDs and source tissue IDs; the registry search matches labels only.

## Theme setup

`src/styles.css` starts with `@import "tailwindcss"` and defines shadcn variables (`--background`, `--foreground`, `--muted`, `--accent`, `--border`, `--ring` and the rest) from the explorer's warm neutral palette, mapped with `@theme inline`. The app's old `--muted` text-color variable was renamed `--muted-ink` to free the shadcn name.

As in the kidneys explorer, the app's base resets moved into `@layer base`, after Tailwind's preflight, so registry utilities still win and the app's component styles stay unlayered. A few preflight defaults the existing CSS relied on are restored in that layer: normal `line-height` on `html`, user-agent heading sizes and weights, inline SVG icons, and `legend` padding. Screenshots of the header, toolbar, chip, detail card, display controls, tour and dialog before and after the Tailwind import were compared; no pixel differed by more than 16 of 255 per channel. `.registry-tree` rules then adapt the tree to the panel's type scale, spacing and pill buttons without touching the component.

## Friction and follow-up

No registry defect blocked the integration and the component was not forked. Observations for other consumers:

1. The public registry hosts were unreachable from the build sandbox; a local server for the built registry plus `REGISTRY_URL` worked with the unmodified CLI.
2. The CLI writes the item's dependency range (`^1.8.0`) over an existing exact pin; re-pin afterwards if the project pins exactly.
3. Tailwind's preflight changes line height, headings, SVG display and legend padding for an app not written against it; compare before/after screenshots.
4. Expansion is internal, so a consumer whose selection can come from elsewhere (3D picks, a tour) must remount to reveal a collapsed row. An optional controlled `expandedIds` prop, or revealing the selected row automatically, would avoid losing the user's disclosure and search.
5. The component has no slot for per-row decoration, so the old colour dots were dropped from the list; colours remain in the scene and selection chip.
6. Search matches labels only; there is no hook for aliases such as source IDs.
