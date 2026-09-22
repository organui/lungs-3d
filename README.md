# OrganUI Lungs

An interactive 3D lung explorer for the web.

**Status:** repository initialized; the viewer has not been implemented yet.

This standalone anatomy example will combine a focused 3D experience with clear interface controls and source code that developers can run and adapt. It is part of the same OrganUI series as [OrganUI Heart](https://github.com/organui/heart-3d) and [OrganUI Liver](https://github.com/organui/liver-3d).

## Planned first release

- Explore both lungs with rotation, zoom, reset, and named camera views.
- Select, label, isolate, hide, and restore structures supported by the chosen model.
- Navigate a searchable anatomy hierarchy linked to the 3D view.
- Fade lung surfaces to reveal the available airway geometry.
- Follow a short guided exploration from the whole lungs to a lobe and its supported structures.
- Use the interface on desktop and mobile, with keyboard-operable controls and a text alternative for anatomy information.

Model inspection will determine the available lobes, segments, and airway detail. Catalog entries alone do not establish that a structure has suitable geometry. Model provenance, content-review status, and limitations will be documented alongside the implementation.

The initial release is an educational interface demonstration. Breathing and airflow simulation are outside its scope.

## Development

The planned foundation is React, TypeScript, Three.js, and Bun. Application scaffolding, dependencies, and verified run commands will be added during implementation.

Read the [build brief](docs/BUILD_BRIEF.md) for the scope and acceptance criteria.

This repository has its own dependencies and Git history. It must run independently of the OrganUI website monorepo and other organ examples.

## Models and attribution

No third-party anatomy assets are included yet. Each selected asset will have its source, version, license, attribution, and modifications recorded. Third-party models retain their own licenses.

## License

Original project code is licensed under the [MIT License](LICENSE). Third-party models and other assets, when added, are governed by their documented licenses.

Part of [OrganUI](https://github.com/organui).
