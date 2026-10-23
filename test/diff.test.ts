import { describe, expect, it } from "vitest";
import { surgicalSplice, spliceString } from "../src/diff";

describe("surgicalSplice", () => {
  it("only replaces the changed middle", () => {
    expect(surgicalSplice(["a", "b", "c", "d"], ["a", "x", "d"])).toEqual({
      index: 1, deleteCount: 2, insert: ["x"],
    });
  });
  it("handles insertion, deletion, and no-op", () => {
    expect(surgicalSplice([], [1, 2])).toEqual({ index: 0, deleteCount: 0, insert: [1, 2] });
    expect(surgicalSplice([1, 2], [1])).toEqual({ index: 1, deleteCount: 1, insert: [] });
    expect(surgicalSplice([1], [1])).toEqual({ index: 1, deleteCount: 0, insert: [] });
  });
  it("returns a minimal string delta", () => {
    expect(spliceString("hello brave world", "hello new world")).toEqual({
      index: 6, deleteCount: 5, insertText: "new",
    });
    expect(spliceString("same", "same")).toEqual({ index: 4, deleteCount: 0, insertText: "" });
  });
});
