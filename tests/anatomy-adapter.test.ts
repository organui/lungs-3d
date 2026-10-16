import { describe, expect, test } from "bun:test";
import {
  anatomyTree,
  assertAnatomyMapping,
  expansionFor,
  hiddenFromVisibility,
  normalizeVisibility,
  sceneIdsForNode,
  visibilityFromHidden,
} from "../src/anatomy-adapter";
import { leafIds, leaves } from "../src/anatomy";
import { initialState, reducer } from "../src/state";

describe("anatomy-to-scene adapter", () => {
  test("maps both panel parts as roots whose leaves are every scene mesh once", () => {
    expect(anatomyTree.map((n) => n.id)).toEqual(["lungs", "airways"]);
    expect(sceneIdsForNode("lungs")).toHaveLength(17);
    expect(sceneIdsForNode("airways")).toEqual([
      "FMA7394",
      "FMA26661",
      "FMA26662",
    ]);
    expect(() => assertAnatomyMapping()).not.toThrow();
  });

  test("parent rows stand for the same leaves the app selects and hides", () => {
    for (const id of ["lungs", "FMA7309", "FMA7333", "FMA7372", "airways"])
      expect(sceneIdsForNode(id)).toEqual(leafIds(id));
    expect(sceneIdsForNode("unknown")).toEqual([]);
    expect(sceneIdsForNode(null)).toEqual([]);
  });

  test("rejects missing, unknown and duplicate leaves", () => {
    const [lungs, airways] = anatomyTree;
    expect(() => assertAnatomyMapping([lungs])).toThrow(/missing=FMA7394/);
    expect(() =>
      assertAnatomyMapping([...anatomyTree, { id: "extra", label: "Extra" }]),
    ).toThrow(/unknown=extra/);
    expect(() =>
      assertAnatomyMapping([
        lungs,
        { ...airways, children: [...airways.children!, airways.children![0]] },
      ]),
    ).toThrow(/duplicates=FMA7394/);
  });

  test("converts hidden lists and leaf visibility maps both ways", () => {
    expect(normalizeVisibility({ FMA7338: false })).toMatchObject({
      FMA7338: false,
      FMA7339: true,
      FMA7394: true,
    });
    expect(Object.keys(normalizeVisibility({}))).toHaveLength(leaves.length);
    const visibility = visibilityFromHidden(["FMA7394", "FMA7338"]);
    expect(visibility.FMA7338).toBe(false);
    expect(visibility.FMA7339).toBe(true);
    expect(hiddenFromVisibility(visibility)).toEqual(["FMA7338", "FMA7394"]);
    expect(hiddenFromVisibility({ lungs: false, FMA7333: false })).toEqual([]);
  });

  test("tree visibility writes the reducer's hidden list", () => {
    const s = reducer(initialState, {
      type: "setHidden",
      hidden: sceneIdsForNode("FMA7333"),
    });
    expect(s.hidden).toEqual(["FMA7338", "FMA7339", "FMA7359"]);
    expect(reducer(s, { type: "restore" }).hidden).toEqual([]);
  });

  test("discloses the ancestors of a selection", () => {
    expect(expansionFor("FMA7338")).toEqual(["lungs", "FMA7309", "FMA7333"]);
    expect(expansionFor("FMA26661")).toEqual(["airways"]);
    expect(expansionFor("lungs")).toEqual([]);
  });
});
