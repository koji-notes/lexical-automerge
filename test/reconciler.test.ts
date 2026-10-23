import { describe, expect, it } from "vitest";
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $isElementNode,
  $getSelection,
  $getRoot,
  $setSelection,
  createEditor,
} from "lexical";
import {
  reconcileEditorState,
  serializeWithStableBlockIds,
} from "../src/reconciler";

function editor() {
  const value = createEditor({
    namespace: "reconciler",
    onError: (error) => {
      throw error;
    },
  });
  value.update(
    () => {
      const first = $createParagraphNode();
      first.append($createTextNode("one"));
      const second = $createParagraphNode();
      second.append($createTextNode("two"));
      $getRoot().append(first, second);
    },
    { discrete: true },
  );
  return value;
}

describe("in-place reconciliation", () => {
  it("preserves unchanged node identity and stable ids across serialization", () => {
    const value = editor();
    const before = value.getEditorState().read(() => $getRoot().getChildren());
    const state = serializeWithStableBlockIds(value);
    reconcileEditorState(value, state);
    const after = value.getEditorState().read(() => $getRoot().getChildren());
    expect(after[0].getKey()).toBe(before[0].getKey());
    expect(
      serializeWithStableBlockIds(value).root.children.map(
        (n) => (n as Record<string, unknown>).blockId,
      ),
    ).toEqual(
      state.root.children.map((n) => (n as Record<string, unknown>).blockId),
    );
  });

  it("reorders and inserts blocks by block id", () => {
    const value = editor();
    const state = serializeWithStableBlockIds(value);
    const children = [
      state.root.children[1],
      {
        ...(state.root.children[0] as object),
        blockId: "new-block",
        children: [{ type: "text", version: 1, text: "new" }],
      },
      state.root.children[0],
    ];
    reconcileEditorState(value, {
      ...state,
      root: { ...state.root, children } as never,
    });
    const result = serializeWithStableBlockIds(value);
    const id = (node: unknown) => (node as Record<string, unknown>).blockId;
    expect(result.root.children.map(id)).toEqual([
      id(state.root.children[1]),
      "new-block",
      id(state.root.children[0]),
    ]);
  });

  it("restores a selection by block identity after text reconciliation", () => {
    const value = editor();
    let key = "";
    value.update(() => {
      const first = $getRoot().getFirstChild();
      const text = first && $isElementNode(first) ? first.getFirstChild() : null;
      key = text?.getKey() ?? "";
      const selection = $createRangeSelection();
      selection.anchor.set(key, 2, "text");
      selection.focus.set(key, 2, "text");
      $setSelection(selection);
    }, { discrete: true });
    const state = serializeWithStableBlockIds(value);
    const first = state.root.children[0] as Record<string, unknown>;
    const children = (first.children as Array<Record<string, unknown>>).map((node) => ({ ...node, text: "one!" }));
    reconcileEditorState(value, {
      ...state,
      root: { ...state.root, children: [{ ...first, children }, ...state.root.children.slice(1)] } as never,
    });
    value.getEditorState().read(() => {
      const selection = $getSelection() as unknown as { anchor: { key: string; offset: number } };
      expect(selection.anchor.offset).toBe(2);
      expect(selection.anchor.key).toBe(key);
    });
  });
});
