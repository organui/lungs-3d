import { byId, leafIds, leaves } from "./anatomy";
export type PickMode = "lobes" | "segments" | "airways";
export type View = "Anterior" | "Posterior" | "Left lateral" | "Right lateral";
export type ViewerState = {
  selected: string;
  hidden: string[];
  opacity: number;
  pick: PickMode;
  view: View;
  cameraKey: number;
  zoom: number;
};
export const initialState: ViewerState = {
  selected: "lungs",
  hidden: [],
  opacity: 1,
  pick: "lobes",
  view: "Anterior",
  cameraKey: 0,
  zoom: 1,
};
export type Action =
  | { type: "select"; id: string }
  | { type: "hide" }
  | { type: "isolate" }
  | { type: "restore" }
  | { type: "setHidden"; hidden: string[] }
  | { type: "reset" }
  | { type: "opacity"; value: number }
  | { type: "pick"; value: PickMode }
  | { type: "view"; value: View }
  | { type: "zoom"; value: number };
export function reducer(s: ViewerState, a: Action): ViewerState {
  switch (a.type) {
    case "select": {
      const n = byId[a.id];
      const airway = n.kind === "airway" || n.id === "airways";
      return {
        ...s,
        selected: a.id,
        hidden: s.hidden.filter((id) => !leafIds(a.id).includes(id)),
        pick: airway ? "airways" : n.kind === "segment" ? "segments" : "lobes",
        opacity: airway
          ? Math.min(s.opacity, 0.18)
          : s.opacity === 0
            ? 1
            : s.opacity,
      };
    }
    case "hide":
      return {
        ...s,
        hidden: [...new Set([...s.hidden, ...leafIds(s.selected)])],
      };
    case "isolate":
      return {
        ...s,
        hidden: leaves
          .map((n) => n.id)
          .filter((id) => !leafIds(s.selected).includes(id)),
      };
    case "restore":
      return { ...s, hidden: [] };
    case "setHidden":
      return {
        ...s,
        hidden: leaves.map((n) => n.id).filter((id) => a.hidden.includes(id)),
      };
    case "reset":
      return { ...initialState, cameraKey: s.cameraKey + 1 };
    case "opacity":
      return {
        ...s,
        opacity: Math.max(0, Math.min(1, a.value)),
        pick: a.value === 0 ? "airways" : s.pick,
      };
    case "pick":
      return {
        ...s,
        pick: a.value,
        opacity:
          a.value === "airways"
            ? Math.min(s.opacity, 0.18)
            : s.opacity === 0
              ? 1
              : s.opacity,
        hidden:
          a.value === "airways"
            ? s.hidden.filter((id) => byId[id].kind !== "airway")
            : s.hidden,
      };
    case "view":
      return { ...s, view: a.value, cameraKey: s.cameraKey + 1, zoom: 1 };
    case "zoom":
      return { ...s, zoom: Math.max(0.65, Math.min(2.4, s.zoom * a.value)) };
  }
}
export function pickTarget(id: string, mode: PickMode): string | undefined {
  const n = byId[id];
  if (!n) return;
  if (mode === "airways") return n.kind === "airway" ? id : undefined;
  if (n.kind !== "segment") return;
  return mode === "lobes" ? n.parent : id;
}
export type Emphasis = "normal" | "selected" | "ghosted";
// Whole-organ and whole-airway selections leave every structure at its own
// color; any narrower selection lifts its parts and ghosts the rest.
export function emphasis(id: string, state: ViewerState): Emphasis {
  if (["lungs", "airways"].includes(state.selected)) return "normal";
  return leafIds(state.selected).includes(id) ? "selected" : "ghosted";
}
