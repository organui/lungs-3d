export type AnatomyNode = {
  id: string;
  name: string;
  short: string;
  kind: "system" | "lung" | "lobe" | "segment" | "airway";
  parent?: string;
  color: string;
  description: string;
  source: string;
  scope?: string;
  tissue?: string;
  elements?: string[];
};
export const catalog = "https://lifesciencedb.jp/bp3d/";
export const reference =
  "https://www.nhlbi.nih.gov/health/lungs/respiratory-system";
const colors = {
  ru: "#d5a286",
  rm: "#91b7a7",
  rl: "#b87f75",
  lu: "#d9b997",
  ll: "#879fae",
};
export const nodes: AnatomyNode[] = [
  {
    id: "lungs",
    name: "Both lungs",
    short: "Both lungs",
    kind: "system",
    color: "#a8b6a5",
    description:
      "The lungs sit on either side of the heart. Explore their lobes, the tissue segments represented in this model, and the branching airways within.",
    source: reference,
  },
  {
    id: "FMA7309",
    name: "Right lung",
    short: "Right lung",
    kind: "lung",
    parent: "lungs",
    color: colors.ru,
    description: "The right lung has three lobes: upper, middle, and lower.",
    source: reference,
  },
  {
    id: "FMA7310",
    name: "Left lung",
    short: "Left lung",
    kind: "lung",
    parent: "lungs",
    color: colors.lu,
    description:
      "The left lung has two lobes. It is smaller than the right, leaving room for the heart.",
    source: reference,
  },
  ...[
    ["FMA7333", "Right upper lobe", "Upper lobe", "FMA7309", colors.ru],
    ["FMA7383", "Right middle lobe", "Middle lobe", "FMA7309", colors.rm],
    ["FMA7337", "Right lower lobe", "Lower lobe", "FMA7309", colors.rl],
    ["FMA7370", "Left upper lobe", "Upper lobe", "FMA7310", colors.lu],
    ["FMA7371", "Left lower lobe", "Lower lobe", "FMA7310", colors.ll],
  ].map(([id, name, short, parent, color]) => ({
    id,
    name,
    short,
    parent,
    color,
    kind: "lobe" as const,
    description: `${name} is shown as the union of its available segment tissue meshes. Expand it to explore the source-defined parts.`,
    source: catalog,
  })),
  ...[
    [
      "FMA7338",
      "Right apical segment",
      "Apical",
      "FMA7333",
      "FMA27369",
      "FJ6604",
    ],
    [
      "FMA7339",
      "Right posterior segment",
      "Posterior",
      "FMA7333",
      "FMA27371",
      "FJ6606",
    ],
    [
      "FMA7359",
      "Right anterior segment",
      "Anterior",
      "FMA7333",
      "FMA27373",
      "FJ6607",
    ],
    [
      "FMA7361",
      "Right lateral segment",
      "Lateral",
      "FMA7383",
      "FMA27452",
      "FJ6608",
    ],
    [
      "FMA7360",
      "Right medial segment",
      "Medial",
      "FMA7383",
      "FMA27448",
      "FJ6609",
    ],
    [
      "FMA7366",
      "Right superior segment",
      "Superior",
      "FMA7337",
      "FMA27385",
      "FJ6610",
    ],
    [
      "FMA7364",
      "Right anterior basal segment",
      "Anterior basal",
      "FMA7337",
      "FMA27391",
      "FJ6611",
    ],
    [
      "FMA7363",
      "Right lateral basal segment",
      "Lateral basal",
      "FMA7337",
      "FMA27389",
      "FJ6612",
    ],
    [
      "FMA7362",
      "Right posterior basal segment",
      "Posterior basal",
      "FMA7337",
      "FMA27393",
      "FJ6605",
    ],
    [
      "FMA7372",
      "Left apicoposterior segment",
      "Apicoposterior",
      "FMA7370",
      "FMA27368",
      "FJ6595+FJ6597",
    ],
    [
      "FMA7373",
      "Left anterior segment",
      "Anterior",
      "FMA7370",
      "FMA27374",
      "FJ6598",
    ],
    [
      "FMA7374",
      "Superior lingular segment",
      "Superior lingular",
      "FMA7370",
      "FMA27375",
      "FJ6599",
    ],
    [
      "FMA7375",
      "Inferior lingular segment",
      "Inferior lingular",
      "FMA7370",
      "FMA27376",
      "FJ6600",
    ],
    [
      "FMA7376",
      "Left superior segment",
      "Superior",
      "FMA7371",
      "FMA27386",
      "FJ6601",
    ],
    [
      "FMA7378",
      "Left anterior basal segment",
      "Anterior basal",
      "FMA7371",
      "FMA27392",
      "FJ6602",
    ],
    [
      "FMA7379",
      "Left lateral basal segment",
      "Lateral basal",
      "FMA7371",
      "FMA27390",
      "FJ6603",
    ],
    [
      "FMA7380",
      "Left posterior basal segment",
      "Posterior basal",
      "FMA7371",
      "FMA27394",
      "FJ6596",
    ],
  ].map(([id, name, short, parent, tissue, elements]) => ({
    id,
    name,
    short,
    parent,
    tissue,
    elements: elements.split("+"),
    color: (
      {
        FMA7333: colors.ru,
        FMA7383: colors.rm,
        FMA7337: colors.rl,
        FMA7370: colors.lu,
        FMA7371: colors.ll,
      } as Record<string, string>
    )[parent],
    kind: "segment" as const,
    description: `The tissue assigned to the ${name.toLowerCase()} in BodyParts3D. Its shape and boundaries come from the source model.`,
    source: catalog,
    scope: ["FMA7364", "FMA7378"].includes(id)
      ? "The source names this anterior basal tissue; its original file is marked “7.8”. No separate medial basal surface is provided."
      : id === "FMA7372"
        ? "Two source pieces share one apicoposterior tissue concept and are selected together."
        : "This is a model-defined tissue region, not a clinically validated segment boundary.",
  })),
  {
    id: "airways",
    name: "Airway tree",
    short: "Airway tree",
    kind: "system",
    color: "#e9cca0",
    description:
      "The trachea divides into bronchi, which branch inside the lungs. Reveal the surfaces to inspect the available airway geometry.",
    source: reference,
    scope:
      "Static branching geometry. Small peripheral airways and alveoli are not represented.",
  },
  {
    id: "FMA7394",
    name: "Trachea",
    short: "Trachea",
    parent: "airways",
    kind: "airway",
    color: "#dfc6a3",
    description:
      "The windpipe carries air toward the right and left main bronchi.",
    source: reference,
    elements: ["FJ6588"],
  },
  {
    id: "FMA26661",
    name: "Right bronchial tree",
    short: "Right bronchial tree",
    parent: "airways",
    kind: "airway",
    color: "#d8b47e",
    description:
      "The available branches of the airway entering the right lung, grouped for selection.",
    source: catalog,
  },
  {
    id: "FMA26662",
    name: "Left bronchial tree",
    short: "Left bronchial tree",
    parent: "airways",
    kind: "airway",
    color: "#d8b47e",
    description:
      "The available branches of the airway entering the left lung, grouped for selection.",
    source: catalog,
  },
];
export const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
export const children = (id: string) => nodes.filter((n) => n.parent === id);
export function ancestors(id: string): AnatomyNode[] {
  const n = byId[id];
  return n.parent ? [...ancestors(n.parent), byId[n.parent]] : [];
}
export const leaves = nodes.filter(
  (n) => n.kind === "segment" || n.kind === "airway",
);
export function leafIds(id: string): string[] {
  const n = byId[id];
  return n.kind === "segment" || n.kind === "airway"
    ? [id]
    : children(id).flatMap((n) => leafIds(n.id));
}
export const lobes = nodes.filter((n) => n.kind === "lobe");
