import { mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Document, NodeIO } from "@gltf-transform/core";
import { simplify, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import { BufferGeometry, Float32BufferAttribute, Color } from "three";
import { leaves, ancestors } from "../src/anatomy";
import inputs from "./model-inputs.json";
const hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
await mkdir(".asset-cache/objs", { recursive: true });
for (const input of inputs.objects) {
  const f = Bun.file(`.asset-cache/objs/${input.file}`);
  if (!(await f.exists())) {
    const r = await fetch(input.url);
    if (!r.ok) throw Error(`Download failed ${input.id}: ${r.status}`);
    await Bun.write(f, r);
  }
  if (hash(new Uint8Array(await f.arrayBuffer())) !== input.sha256)
    throw Error(`Checksum mismatch ${input.id}`);
}
const mapBytes = new Uint8Array(
  await Bun.file("docs/model-source/FMA2Obj-4.3.tsv").arrayBuffer(),
);
if (
  hash(mapBytes) !==
  "c3d16c891016da13447de2fc3241d05d92e8f9dc460e363233c03f420b935d4f"
)
  throw Error("Official concept mapping changed");
const mappings = new TextDecoder()
  .decode(mapBytes)
  .split(/\r?\n/)
  .filter((l) => !l.startsWith("#") && l)
  .map((l) => l.split("\t"));
const members = (id: string, tree = "part_of") =>
  mappings.find((r) => r[0] === id && r[1] === tree)?.[2].split("+") ?? [];
const sourceRows = (
  await Bun.file("docs/model-source/selected-elements.tsv").text()
)
  .trim()
  .split("\n")
  .slice(1)
  .map((l) => l.split("\t"));
const sourceById = Object.fromEntries(sourceRows.map((r) => [r[0], r]));
const used = new Set<string>();
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity];
const prepared = [];
for (const s of leaves) {
  const ids =
    s.elements ??
    members(s.id).filter((id) => inputs.objects.some((i) => i.id === id));
  if (!ids.length) throw Error(`No selected geometry ${s.id}`);
  const concept = s.tissue ?? s.id;
  const expected = members(concept);
  if (ids.some((id) => !expected.includes(id)))
    throw Error(`Invalid mapping ${concept}`);
  if (s.kind === "segment")
    for (const parent of [
      s,
      ...ancestors(s.id).filter((n) => n.id !== "lungs"),
    ])
      if (ids.some((id) => !members(parent.id).includes(id)))
        throw Error(`Tissue missing from parent ${parent.id}`);
  const positions: number[] = [],
    indices: number[] = [];
  const elements = [];
  for (const id of ids) {
    if (used.has(id)) throw Error(`Duplicate element ${id}`);
    used.add(id);
    const input = inputs.objects.find((i) => i.id === id)!;
    const bytes = new Uint8Array(
      await Bun.file(`.asset-cache/objs/${id}.obj`).arrayBuffer(),
    );
    const text = new TextDecoder().decode(bytes);
    const row = sourceById[id];
    const header = (name: string) =>
      text.match(new RegExp(`^# ${name} : (.+)$`, "m"))?.[1].trim();
    if (
      !row ||
      header("File ID") !== id ||
      header("Concept ID") !== row[2] ||
      header("Compatibility version") !== "4.3"
    )
      throw Error(`Geometry header does not match official metadata: ${id}`);
    const offset = positions.length / 3;
    let vertices = 0,
      triangles = 0;
    const bmin = [Infinity, Infinity, Infinity],
      bmax = [-Infinity, -Infinity, -Infinity];
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim().split(/\s+/);
      if (t[0] === "v") {
        const p = t.slice(1, 4).map(Number);
        if (p.length !== 3 || !p.every(Number.isFinite))
          throw Error(`Invalid vertex ${id}`);
        p.forEach((v, j) => {
          min[j] = Math.min(min[j], v);
          max[j] = Math.max(max[j], v);
          bmin[j] = Math.min(bmin[j], v);
          bmax[j] = Math.max(bmax[j], v);
        });
        positions.push(...p);
        vertices++;
      }
      if (t[0] === "f") {
        const f = t.slice(1).map((x) => {
          const n = Number(x.split("/")[0]);
          return offset + (n > 0 ? n - 1 : vertices + n);
        });
        for (let j = 1; j < f.length - 1; j++) {
          indices.push(f[0], f[j], f[j + 1]);
          triangles++;
        }
      }
    }
    if (!vertices || !triangles) throw Error(`Empty mesh ${id}`);
    elements.push({
      ...input,
      sourceConcept: row[2],
      sourceName: row[3],
      originalName: row[4],
      originalFile: row[5],
      vertices,
      triangles,
      bounds: { min: bmin, max: bmax },
    });
  }
  if (
    indices.some(
      (i) => i < 0 || i >= positions.length / 3 || !Number.isInteger(i),
    )
  )
    throw Error(`Invalid topology ${s.id}`);
  prepared.push({ s, positions, indices, elements });
}
if (used.size !== inputs.objects.length)
  throw Error(
    `Unused input meshes: ${inputs.objects.filter((i) => !used.has(i.id)).map((i) => i.id)}`,
  );
const center = min.map((v, j) => (v + max[j]) / 2),
  scale = 0.018;
const doc = new Document(),
  buffer = doc.createBuffer(),
  scene = doc.createScene("OrganUI Lungs — BodyParts3D 4.3");
doc.getRoot().getAsset().copyright =
  "BodyParts3D / Anatomography, © The Database Center for Life Science. CC BY-SA 2.1 Japan. Adapted by OrganUI.";
for (const { s, positions, indices } of prepared) {
  const p = new Float32Array(positions.length);
  for (let i = 0; i < p.length; i += 3) {
    p[i] = (positions[i] - center[0]) * scale;
    p[i + 1] = (positions[i + 2] - center[2]) * scale;
    p[i + 2] = -(positions[i + 1] - center[1]) * scale;
  }
  const geo = new BufferGeometry()
    .setAttribute("position", new Float32BufferAttribute(p, 3))
    .setIndex(indices);
  geo.computeVertexNormals();
  const color = new Color(s.color),
    material = doc
      .createMaterial(s.id)
      .setBaseColorFactor([color.r, color.g, color.b, 1])
      .setRoughnessFactor(0.6);
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      "POSITION",
      doc.createAccessor().setType("VEC3").setArray(p).setBuffer(buffer),
    )
    .setAttribute(
      "NORMAL",
      doc
        .createAccessor()
        .setType("VEC3")
        .setArray(new Float32Array(geo.getAttribute("normal").array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc
        .createAccessor()
        .setType("SCALAR")
        .setArray(new Uint32Array(indices))
        .setBuffer(buffer),
    )
    .setMaterial(material);
  scene.addChild(
    doc
      .createNode(s.id)
      .setMesh(doc.createMesh(s.id).addPrimitive(primitive))
      .setExtras({
        structureId: s.id,
        tissueConcept: s.tissue ?? null,
        elements: prepared
          .find((p) => p.s.id === s.id)!
          .elements.map((e) => e.id),
      }),
  );
  geo.dispose();
}
await MeshoptSimplifier.ready;
// Error bound preserves shape; not all meshes can reach the requested reduction.
await doc.transform(
  weld(),
  simplify({
    simplifier: MeshoptSimplifier,
    ratio: 0.35,
    error: 0.0002,
    lockBorder: true,
  }),
);
const runtimeCounts = Object.fromEntries(
  doc
    .getRoot()
    .listNodes()
    .map((n) => {
      const p = n.getMesh()!.listPrimitives()[0];
      return [
        n.getName(),
        {
          vertices: p.getAttribute("POSITION")!.getCount(),
          triangles: p.getIndices()!.getCount() / 3,
        },
      ];
    }),
);
const bytes = await new NodeIO().writeBinary(doc);
await Bun.write("public/models/lungs.glb", bytes);
await Bun.write(
  "public/models/manifest.json",
  JSON.stringify(
    {
      dataset: "BodyParts3D / Anatomography",
      dataVersion: "4.3",
      objectsSet: "4.3",
      treeVersion: "FMA3.0",
      retrieved: "2026-09-22",
      license: "CC-BY-SA-2.1-JP",
      licenseUrl: "https://lifesciencedb.jp/bp3d/info/index.html#License",
      credit: doc.getRoot().getAsset().copyright,
      sourceService: "https://lifesciencedb.jp/bp3d/download.cgi",
      mappingUrl:
        "https://lifesciencedb.jp/bp3d/get-info.cgi?version=4.3&cmd=concept-objfiles-list",
      mappingSha256: hash(mapBytes),
      mirrorCommit: inputs.mirrorCommit,
      transform: {
        sourceBounds: { min, max },
        center,
        scale,
        axes: "[x,z,-y]",
      },
      simplification: { ratio: 0.35, error: 0.0002, lockBorder: true },
      runtime: { file: "lungs.glb", bytes: bytes.length, sha256: hash(bytes) },
      structures: prepared.map(({ s, elements }) => ({
        id: s.id,
        name: s.name,
        kind: s.kind,
        tissueConcept: s.tissue ?? null,
        parent: s.parent,
        elements,
        runtime: runtimeCounts[s.id],
      })),
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${prepared.length} groups, ${used.size} source elements; ${(bytes.length / 1e6).toFixed(2)} MB; SHA256 ${hash(bytes)}`,
);
