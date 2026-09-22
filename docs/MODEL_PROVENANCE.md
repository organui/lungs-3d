# Model provenance, scope, and review

## Selected data and license

The runtime model uses **BodyParts3D / Anatomography 4.3**, object set **4.3**, ontology tree **FMA3.0**, retrieved **2026-09-22**. All selected OBJ headers independently report compatibility version 4.3. The original element table identifies the selected source files as `140325-separated Lung10Pieces.obj` and `140325-trachea.obj` (25 March 2014).

Primary sources:

- [Original project and license notice](https://lifesciencedb.jp/bp3d/info/index.html), including its warning that concepts and geometry can contain errors.
- [Official version-stamped concept-to-element download](https://lifesciencedb.jp/bp3d/get-info.cgi?version=4.3&cmd=concept-objfiles-list). The extracted, unchanged text is [preserved here](model-source/FMA2Obj-4.3.tsv). SHA-256: `c3d16c891016da13447de2fc3241d05d92e8f9dc460e363233c03f420b935d4f`.
- Original element table: POST `https://lifesciencedb.jp/bp3d/get-info.cgi` with `cmd=upload-all-list`, `load=1`, `md_abbr=bp3d`, `title=obj2FMA`, `tree=isa`, `version=4.3`. The full response hash is `cab10eda6338a6935d0216810eaba78dd049877df496323a0a4916d290dd8e3a`; the relevant rows are preserved in [selected-elements.tsv](model-source/selected-elements.tsv). These rows identify original model filenames as well as FJ, BP, and FMA identifiers.
- [Source coordinate diagram](https://dbarchive.biosciencedbc.jp/archive/bodyparts3d/images/coordinate_system.png): +x patient-left, −y anterior, +z superior.

The original project explicitly permits modification and redistribution of contour data and rendered images under **[CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)** ([legal text](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode)). An [inert snapshot of its notice](model-source/original-license.html.txt) is included. This license governs `public/models/lungs.glb`, the adapted model data, and model screenshots, separately from the MIT application code.

Credit: **BodyParts3D / Anatomography, © The Database Center for Life Science (DBCLS).** Adapted by OrganUI: subset selection, shared coordinate transform, normals, mesh simplification, illustrative materials, and GLB conversion. No endorsement is implied. [Runtime credit and license links](../public/models/LICENSE.txt) also ship with the app and appear in its model-scope dialog.

The [LSDB archive license](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), updated 2025-02-27, grants CC BY 4.0 for its archived database. That archive supplies 4.0; this application instead uses the 4.3 original-service data and follows the original service's explicit share-alike notice. We do **not** extend the archive's 4.0 license grant to these 4.3 assets. Its [snapshot](model-source/archive-license.html.txt) records the candidate-source investigation.

## Retrieval and exact pinning

The official service's large mesh downloads stalled during inspection. The geometry was retrieved from the public [olivercase/body_parts_3d_api mirror](https://github.com/olivercase/body_parts_3d_api), pinned at commit `fd527e6f4daf732fd814314d9257df5877b844bc`. **Every original OBJ was verified against the SHA-256 in its pinned Git LFS pointer**, and its embedded FJ ID, FMA concept, and compatibility version were cross-checked with the official metadata. Mirror representation/BP numbers differ from the original live table; geometry identity and anatomy mapping use FJ and FMA identifiers, not those BP numbers.

[model-inputs.json](../scripts/model-inputs.json) pins every retrieval URL, original byte length, SHA-256, LFS pointer URL, and mirror path. [The runtime manifest](../public/models/manifest.json) adds exact anatomy ownership, source labels and filenames, raw bounds, counts, conversion settings, and output checksum for each structure. Runtime setup never contacts the mirror or depends on a sibling repository.

The official alternative is POST `https://lifesciencedb.jp/bp3d/download.cgi`, in a fresh anonymous service session, with JSON arrays `ids=[FJ…]`, `rep_id=[BP…]`, plus `type=art_file` and `all_downloads=1`. Use the current official table for BP representations. The reproducible script uses the pinned mirror, rather than relying on generated ZIP bytes or mutable representation numbers.

## What was inspected and excluded

The 4.0 PART-OF catalog has entries for lungs, lobes, and segments. Its compound-element mappings resolve those entries to airway and vascular elements **without parenchymal lung surfaces**. Therefore, catalog presence alone did not satisfy the required surface explorer. The 4.3 data supplies the tissue needed for this implementation.

The 4.3 compound groups contain older and newer alternatives. Only the matched March 2014 source geometry is included:

| Geometry | Selection | Grouping |
| --- | --- | --- |
| Lung tissue | FJ6595–FJ6612, 18 elements | 17 source-defined segment tissue groups |
| Trachea | FJ6588 | FMA7394 |
| Right bronchial tree | 54 elements from FJ6488–FJ6587, as mapped by FMA26661 | One selectable airway group |
| Left bronchial tree | 46 elements from FJ6488–FJ6587, as mapped by FMA26662 | One selectable airway group |

All 119 elements have exactly one runtime owner. The old FJ24xx/25xx airway alternatives are excluded. Unmapped alternative five-piece lobe meshes FJ6590–FJ6594 are excluded. Vessels, alveoli, pleura, adjacent organs, and airway branches absent from the source are not created or shown.

## Hierarchy and naming decisions

Lung → lobe → segment edges come from the official [PART-OF inclusion table](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_inclusion_relation_list.txt); selected direct rows are [preserved](model-source/selected-relations.tsv). Each selected segment's tissue concept resolves to its explicit element set in the official 4.3 mapping. The preparation script also verifies that **every tissue element belongs to its displayed segment, lobe, and lung** in that 4.3 PART-OF mapping. Parents are unions of their leaf meshes, never overlapping extra shells. Lung/lobe controls intentionally select tissue only; airways form a separate control group.

| Lobe | Segment tissue concepts shown | Tissue elements |
| --- | --- | --- |
| Right upper, FMA7333 | Apical FMA27369, posterior FMA27371, anterior FMA27373 | FJ6604, FJ6606, FJ6607 |
| Right middle, FMA7383 | Lateral FMA27452, medial FMA27448 | FJ6608, FJ6609 |
| Right lower, FMA7337 | Superior FMA27385, anterior basal FMA27391, lateral basal FMA27389, posterior basal FMA27393 | FJ6610–FJ6612, FJ6605 |
| Left upper, FMA7370 | Apicoposterior FMA27368, anterior FMA27374, superior lingular FMA27375, inferior lingular FMA27376 | FJ6595, FJ6597–FJ6600 |
| Left lower, FMA7371 | Superior FMA27386, anterior basal FMA27392, lateral basal FMA27390, posterior basal FMA27394 | FJ6601–FJ6603, FJ6596 |

Key limitations are visible in the interface:

- Left apicoposterior tissue consists of two original pieces mapped to the **same** FMA concept. They remain one selectable group. Separate left apical/posterior compound alternatives are not added.
- Both anterior-basal tissue files have original names marked `7.8`, but their source concepts say **anterior basal**. We preserve that source label and explicitly disclose the filename ambiguity. No distinct medial-basal tissue surface is supplied or invented.
- Seventeen is the number of segment **groups represented by this model**, not a claim about a universal anatomical segment count.
- Source seams, tissue interfaces, cut ends, simplified branches, and some imperfect local tissue/airway fit remain. They are not validated clinical boundaries. Transparency exposes interior faces as well as the outer shape.
- The general reference body is an adult male model, not patient-specific geometry or a measurement instrument.

## Conversion and reproducibility

A fresh checkout includes the **3,901,260-byte** GLB. Runtime SHA-256:

`b2b19e5f7473036598e3552a5835a4ebc0f55c786ddd00863cb6a170409ed346`

Run `bun run prepare:model` to reproduce it with the locked dependencies. Raw OBJ downloads go only into ignored `.asset-cache/objs/`. Original input totals: **14,736,781 bytes, 138,393 vertices, 199,652 triangles**.

Preparation:

1. Download/check each source hash; validate official mapping hash, element membership, and exclusive ownership.
2. Parse positions and faces; validate finite coordinates and indices. Preserve source placement. Fan-triangulate polygon faces if present.
3. Apply one shared center `[-0.137, -106.13425, 1255.975]` mm, map `(x,y,z)` to `(x,z,-y)`, and uniformly scale by `0.018`. Viewer +x is patient-left, +y superior, +z anterior. No per-part centering, mirroring, stretching, or manual alignment is applied.
4. Compute normals, assign illustrative materials, and group meshes. Simplify with glTF Transform / Meshoptimizer: requested ratio 0.35, error 0.0002, border locking. The conservative error bound means many meshes retain more than the target ratio. No smoothing/sculpting or synthetic branches are introduced.
5. Export 20 indexed GLB groups: **120,335 vertices, 165,844 triangles**. Record each group and original element in the manifest.

`bun run verify:model` independently decodes the GLB and verifies the output hash, 20 anatomy IDs, 119 unique elements, topology bounds, finite vertices, per-group counts, and source patient laterality. The preparation script rejects changed upstream content rather than silently updating pins.

## Content review

The general lung/trachea explanations were checked against [NHLBI: The Respiratory System](https://www.nhlbi.nih.gov/health/lungs/respiratory-system) on 2026-09-22. Lobe and segment text describes the source model's grouping rather than asserting clinical function or vascular territories. Each panel links to its source. No source illustrations are redistributed.

Completed: developer review of IDs, direct hierarchy relationships, compound mappings, geometry headers/checksums, common coordinate transform, actual desktop/mobile rendering, and interface behavior. **Pending: independent review by a qualified anatomist or clinician.** No diagnostic, surgical, physiological, or patient-specific validation is claimed.

## Other assets

DM Sans and Manrope are self-hosted, pinned Fontsource packages under SIL Open Font License 1.1. Lucide icons use ISC. Complete notices are in [public/licenses](../public/licenses). The simple OrganUI lungs mark is original SVG artwork. No tracking, external font requests, runtime APIs, or CDN model dependencies are required.
