import { describe, expect, it } from "vitest";
import * as Automerge from "@automerge/automerge";
import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from "lexical";
import { createLexicalAutomergeDocument } from "../src/binding";
import { editorStateFromDocument, syncDocument } from "../src/persistence";
import { reconcileEditorState, serializeWithStableBlockIds } from "../src/reconciler";
import type { LexicalAutomergeDocument, LexicalBlockRecord } from "../src/types";

function twoBlockDocument(): LexicalAutomergeDocument {
  const editor = createEditor({ namespace: "sync", onError: (error) => { throw error; } });
  editor.update(() => {
    const first = $createParagraphNode();
    first.append($createTextNode("alpha"));
    const second = $createParagraphNode();
    second.append($createTextNode("beta"));
    $getRoot().append(first, second);
  }, { discrete: true });
  return createLexicalAutomergeDocument(serializeWithStableBlockIds(editor));
}

function withText(block: LexicalBlockRecord, text: string): LexicalBlockRecord {
  const children = (block.node.children as Array<Record<string, unknown>>).map((child) => ({ ...child, text }));
  return { ...block, text, node: { ...block.node, children } };
}

describe("per-block sync", () => {
  it("merges concurrent edits to different blocks and root format", () => {
    const doc = twoBlockDocument();
    const [idA, idB] = doc.order;
    const base = Automerge.from(doc as unknown as Record<string, unknown>);
    const leftNext = structuredClone(doc);
    leftNext.blocks[idA] = withText(leftNext.blocks[idA], "ALPHA");
    const rightNext = structuredClone(doc);
    rightNext.root = { ...rightNext.root, format: "center" };
    rightNext.blocks[idB] = withText(rightNext.blocks[idB], "BETA");
    const left = Automerge.change(Automerge.clone(base), (draft) => {
      syncDocument(draft as unknown as LexicalAutomergeDocument, leftNext);
    });
    const right = Automerge.change(Automerge.clone(base), (draft) => {
      syncDocument(draft as unknown as LexicalAutomergeDocument, rightNext);
    });
    const merged = Automerge.merge(left, right) as unknown as LexicalAutomergeDocument;
    expect(merged.blocks[idA].text).toBe("ALPHA");
    expect(merged.blocks[idB].text).toBe("BETA");
    expect(merged.root.format).toBe("center");

    const editor = createEditor({ namespace: "sync-apply", onError: (error) => { throw error; } });
    reconcileEditorState(editor, editorStateFromDocument(merged));
    editor.getEditorState().read(() => {
      expect($getRoot().getChildren().map((node) => node.getTextContent())).toEqual(["ALPHA", "BETA"]);
      expect($getRoot().getFormatType()).toBe("center");
    });
  });
});
