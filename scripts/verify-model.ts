import { NodeIO } from "@gltf-transform/core";
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
import { leaves, leafIds, byId } from "../src/anatomy";
import manifest from "../public/models/manifest.json";
const data = new Uint8Array(
  await Bun.file("public/models/lungs.glb").arrayBuffer(),
);
assert.equal(
  createHash("sha256").update(data).digest("hex"),
  manifest.runtime.sha256,
);
assert.equal(data.length, manifest.runtime.bytes);
const doc = await new NodeIO().readBinary(data),
  nodes = doc.getRoot().listNodes();
assert.equal(nodes.length, 20);
assert.deepEqual(
  nodes.map((n) => n.getName()).sort(),
  leaves.map((n) => n.id).sort(),
);
const used = new Set<string>();
let vertices = 0,
  triangles = 0;
for (const node of nodes) {
  const id = node.getName(),
    record = manifest.structures.find((s) => s.id === id)!;
  assert(record);
  assert.equal(record.name, byId[id].name);
  const p = node.getMesh()!.listPrimitives()[0],
    positions = p.getAttribute("POSITION")!,
    indices = p.getIndices()!;
  assert.equal(positions.getCount(), record.runtime.vertices);
  assert.equal(indices.getCount() / 3, record.runtime.triangles);
  for (const x of positions.getArray()!) assert(Number.isFinite(x));
  for (const index of indices.getArray()!)
    assert(
      Number.isInteger(index) && index >= 0 && index < positions.getCount(),
    );
  for (const e of record.elements) {
    assert(!used.has(e.id), `Duplicate ${e.id}`);
    used.add(e.id);
    assert(e.vertices > 0 && e.triangles > 0);
  }
  // Patient-left is +x; right lung should be fully on the negative side in source space.
  if (leafIds("FMA7309").includes(id))
    for (const e of record.elements) assert(e.bounds.max[0] < 1);
  if (leafIds("FMA7310").includes(id))
    for (const e of record.elements) assert(e.bounds.min[0] > -1);
  vertices += positions.getCount();
  triangles += indices.getCount() / 3;
}
assert.equal(used.size, 119);
assert.equal(leafIds("lungs").length, 17);
console.log(
  `Verified ${nodes.length} groups / ${used.size} unique elements / ${vertices} vertices / ${triangles} triangles; hash, anatomy IDs, index bounds and patient laterality pass.`,
);
