# OrganUI Lungs: first-release build brief

## Purpose

Build a polished, interactive anatomical lung explorer with useful interface controls and source code developers can run and adapt. This is the third example in OrganUI's initial organ series, alongside OrganUI Heart and OrganUI Liver.

The intended launch pairs a live demo, a short video, and a public repository. This example should demonstrate navigation through nested anatomy and the relationship between lung surfaces and visible airway structures. Customer demand and clinical usability have not yet been validated.

## Repository direction

- Repository: `organui/lungs-3d`.
- Public title: **OrganUI Lungs**.
- Standalone application alongside the existing OrganUI Turborepo, `heart-3d`, and `liver-3d` repositories.
- This repository contains the application, chosen runtime assets, provenance, documentation, and verification work needed to run it independently.
- The OrganUI monorepo is reserved for the later website, documentation, registry, and packages. Insights from working examples will inform those boundaries.
- Learn from the sibling examples where useful, but do not modify them or require their checkouts. A common viewer package should follow demonstrated reuse.

## Technology direction

Use React, TypeScript, Three.js, and Bun. A small Vite application is a reasonable starting point; React Three Fiber may be used where it helps implementation. Check current compatibility before selecting dependency versions. This is a proposed direction, not an existing application scaffold.

The sibling site's Base UI / Nova selection is useful visual context, but this app must not import that repository or require its setup. Choose interface dependencies for this application's needs.

## Model selection comes first

Inspect candidate geometry before committing to interactions. Build an inventory of actual meshes, anatomical identifiers, source labels, and parent/child relationships. Identify which lung surfaces, lobes, bronchopulmonary segments, trachea, and airway branches are actually represented.

The BodyParts3D PART-OF catalog, checked on 22 September 2026, includes entries for both lungs, lobes, bronchopulmonary segments, and bronchial trees. These entries are promising candidates; geometry has not been inspected for this repository. A catalog identifier may denote a compound structure rather than an independent mesh. Resolve element mappings and check for duplicates, overlapping alternative representations, and missing geometry before constructing the hierarchy.

- [Official archive download page](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [PART-OF structure catalog](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_parts_list_e.txt)
- [Official archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)

The official archive license page, checked on 22 September 2026, states CC BY 4.0, with a last-update date of 27 February 2025. Check the exact downloaded source and record its applicable terms; older project pages and downstream copies can have different license statements.

For each included asset, record its source URL, source/version identifier, license, required credits, checksum, preparation steps, and any modifications. Preserve anatomical orientation and relative positioning when converting related meshes. Keep large raw downloads and intermediate exports out of ordinary source history. Include practical runtime assets or a reproducible, documented retrieval step so a fresh checkout can run.

Do not fabricate missing airway branches, segment boundaries, or microscopic structures. Document the source model's anatomical variants and limitations where relevant. Present labels as anatomy represented by this model rather than claiming every person has precisely the same configuration.

## First-release experience

1. Open into a carefully composed view of both lungs, with visible loading progress while the model loads.
2. Rotate and zoom with understandable controls and a reliable reset action.
3. Navigate a searchable anatomy hierarchy from lung to lobe to supported segment. Keep the list, breadcrumbs or equivalent context, and scene selection synchronized.
4. Display the selected structure's name and a concise sourced explanation.
5. Isolate or hide supported structures and restore the full view without losing control of the scene.
6. Provide a clear surface-opacity or reveal control to expose the available airway geometry. Make the selection policy explicit when surfaces are transparent so users can select the intended visible structure.
7. Offer useful named camera views and a short guided exploration based on actual available anatomy.
8. Adapt to mobile, support keyboard operation of interface controls, respect reduced-motion preferences, and make anatomy information available as text.
9. Show clear recovery or fallback behavior for missing assets and unavailable WebGL.

If candidate models do not support a planned interaction, document the finding and adjust the scope honestly. Hierarchy controls should not lead to empty or invented anatomy. The scene should remain usable after any combination of hiding, isolation, opacity changes, and resetting.

Present this as an educational interface demonstration and record the review status of labels and explanations. Breathing, airflow, and gas-exchange simulation, disease overlays, lesion detection, and treatment or surgical planning are outside this release. Any later additions need suitable source data and an appropriate accuracy review.

## Design direction

The lungs should be the visual focus. Use restrained typography, legible annotations, a coherent color system, and controls that make the task obvious. Use color consistently to distinguish supported structures and document when colors are illustrative. Keep airway geometry readable as surface opacity changes, and inspect transparency artifacts from several angles.

Potential demonstration sequence: show both lungs, select a lobe, isolate it, reveal the supported airways, expand its anatomy hierarchy, then restore the full view. The eventual video must show interactions that actually work.

## Acceptance criteria

- A fresh checkout can install dependencies and run using documented Bun commands, independently of sibling repositories.
- The real selected lung and airway models render successfully in a browser with correct relative alignment and orientation.
- Rotation, zoom, reset, scene/list selection, hierarchy navigation, isolation/restoration, and named views work for the documented model scope.
- Surface reveal works visually and has predictable selection behavior. Reset restores a useful default scene after visibility and opacity changes.
- Structure labels and hierarchy map to actual model elements and documented relationships; references, limitations, and content-review status are recorded.
- Desktop and mobile layouts are visually inspected. Meaningful interaction checks cover selection, hierarchy navigation, visibility, opacity, and reset.
- Applicable type checks and a production build pass. Material browser errors are resolved or clearly reported.
- README includes verified setup commands, screenshots or preview material when available, attribution, and an honest description of the completed scope.

The focused implementation task should build and verify this application locally. Other organ tasks may run concurrently: choose a free port and do not stop their services. Public deployment and social posting can follow when requested. Repository initialization alone does not mean the viewer has been built.
