import {
  anatomyIndex,
  leafIds as treeLeafIds,
  type AnatomyNode as TreeNode,
} from "@/components/ui/anatomy-tree";
import { byId, children, leaves, type AnatomyNode } from "./anatomy";

// The explorer's panel shows two parts: the lung anatomy (both lungs → lung →
// lobe → source-defined segment tissue) and the airway tree (trachea and the
// two bronchial trees). Both map onto the registry tree as two roots that
// reuse the application's own structure IDs, so the tree's controlled
// selection is the app's selected ID with no translation. Every parent row is
// an existing, selectable app structure; no extra `group-*` rows are needed,
// so no row sets `selectable: false`. Each leaf row carries the colour its
// scene mesh is drawn in as the tree's decorative swatch.
export const treeRoots = ["lungs", "airways"] as const;

function toTreeNode(node: AnatomyNode): TreeNode {
  const kids = children(node.id);
  return kids.length
    ? { id: node.id, label: node.short, children: kids.map(toTreeNode) }
    : { id: node.id, label: node.short, color: node.color };
}

export const anatomyTree: TreeNode[] = treeRoots.map((id) =>
  toTreeNode(byId[id]),
);

/** Scene leaves are the GLB meshes: segment tissue groups and airways. */
export const sceneLeafIds = leaves.map(({ id }) => id);
const sceneLeafSet = new Set<string>(sceneLeafIds);
const { nodes: treeNodes } = anatomyIndex(anatomyTree);

/** Disclosure for the initial panel: lungs open, airway tree collapsed. */
export const defaultExpandedIds = ["lungs"];

/** Scene meshes a tree row stands for: itself, or all descendant leaves. */
export function sceneIdsForNode(id: string | null): string[] {
  if (!id) return [];
  const node = treeNodes.get(id);
  if (!node) return [];
  return treeLeafIds(node).filter((leaf) => sceneLeafSet.has(leaf));
}

/** The tree's contract: a leaf-ID map in which a missing entry is visible. */
export function normalizeVisibility(
  visibility: Readonly<Record<string, boolean>>,
): Record<string, boolean> {
  return Object.fromEntries(
    sceneLeafIds.map((id) => [id, visibility[id] !== false]),
  );
}

/** App hidden list → controlled tree visibility. */
export function visibilityFromHidden(
  hidden: readonly string[],
): Record<string, boolean> {
  const set = new Set(hidden);
  return Object.fromEntries(sceneLeafIds.map((id) => [id, !set.has(id)]));
}

/** Tree visibility → the app's hidden list, in stable scene-leaf order. */
export function hiddenFromVisibility(
  visibility: Readonly<Record<string, boolean>>,
): string[] {
  const normalized = normalizeVisibility(visibility);
  return sceneLeafIds.filter((id) => !normalized[id]);
}

export function assertAnatomyMapping(data: readonly TreeNode[] = anatomyTree) {
  const ids = data.flatMap(treeLeafIds);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  const missing = sceneLeafIds.filter((id) => !ids.includes(id));
  const unknown = ids.filter((id) => !sceneLeafSet.has(id));
  if (duplicates.length || missing.length || unknown.length)
    throw new Error(
      `Invalid anatomy mapping: duplicates=${duplicates.join(",")} missing=${missing.join(",")} unknown=${unknown.join(",")}`,
    );
}

assertAnatomyMapping();
