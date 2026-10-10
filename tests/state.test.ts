import { describe, expect, test } from "bun:test";
import { emphasis, initialState, reducer, pickTarget } from "../src/state";
import { leafIds, leaves, nodes } from "../src/anatomy";
describe("anatomical selection and visibility", () => {
  test("five lobes partition 17 tissue groups exactly once", () => {
    const all = nodes
      .filter((n) => n.kind === "lobe")
      .flatMap((n) => leafIds(n.id));
    expect(all.length).toBe(17);
    expect(new Set(all).size).toBe(17);
    expect(leafIds("lungs").sort()).toEqual(all.sort());
  });
  test("selecting hidden tissue restores it and switching to airway picking reveals airways", () => {
    let s = reducer(initialState, { type: "select", id: "FMA7333" });
    s = reducer(s, { type: "isolate" });
    s = reducer(s, { type: "hide" });
    expect(s.hidden.length).toBe(leaves.length);
    s = reducer(s, { type: "select", id: "FMA7338" });
    expect(s.hidden).not.toContain("FMA7338");
    s = reducer(s, { type: "pick", value: "airways" });
    expect(s.opacity).toBe(0.18);
    expect(s.hidden).not.toContain("FMA7394");
  });
  test("reset recovers from empty scene, opacity zero, zoom and lateral view", () => {
    let s = reducer(initialState, { type: "select", id: "airways" });
    s = reducer(s, { type: "isolate" });
    s = reducer(s, { type: "hide" });
    s = reducer(s, { type: "opacity", value: 0 });
    s = reducer(s, { type: "zoom", value: 2 });
    s = reducer(s, { type: "view", value: "Posterior" });
    s = reducer(s, { type: "reset" });
    expect(s).toEqual({ ...initialState, cameraKey: 2 });
  });
  test("transparent surfaces never intercept airway selection", () => {
    expect(pickTarget("FMA7338", "airways")).toBeUndefined();
    expect(pickTarget("FMA7394", "lobes")).toBeUndefined();
    expect(pickTarget("FMA7338", "lobes")).toBe("FMA7333");
    expect(pickTarget("FMA7338", "segments")).toBe("FMA7338");
    expect(pickTarget("FMA7394", "airways")).toBe("FMA7394");
  });
  test("group selection and isolation remain coherent after nested hiding", () => {
    let s = reducer(initialState, { type: "select", id: "FMA7338" });
    s = reducer(s, { type: "hide" });
    s = reducer(s, { type: "select", id: "FMA7333" });
    expect(leafIds("FMA7333").every((id) => !s.hidden.includes(id))).toBe(true);
    s = reducer(s, { type: "isolate" });
    expect(
      leaves
        .filter((n) => !s.hidden.includes(n.id))
        .map((n) => n.id)
        .sort(),
    ).toEqual(leafIds("FMA7333").sort());
    s = reducer(s, { type: "restore" });
    expect(s.hidden).toEqual([]);
    expect(s.selected).toBe("FMA7333");
  });
  test("a narrow selection stands out and the rest recedes", () => {
    expect(emphasis("FMA7338", initialState)).toBe("normal");
    let s = reducer(initialState, { type: "select", id: "FMA7333" });
    for (const id of leafIds("FMA7333"))
      expect(emphasis(id, s)).toBe("selected");
    const others = leaves.filter((n) => !leafIds("FMA7333").includes(n.id));
    expect(others.length).toBeGreaterThan(0);
    for (const n of others) expect(emphasis(n.id, s)).toBe("ghosted");
    s = reducer(s, { type: "select", id: "airways" });
    expect(leaves.every((n) => emphasis(n.id, s) === "normal")).toBe(true);
  });
});
