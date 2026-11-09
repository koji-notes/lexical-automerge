import { describe, expect, it } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import { $createParagraphNode, $createTextNode, $getRoot, $isElementNode, $isTextNode, createEditor } from "lexical";
import { bindLexicalToAutomerge } from "../src/binding";
import { createLexicalAutomergeDocument } from "../src/binding";

function makeEditor() {
  const editor = createEditor({ namespace: "test", onError: (error) => { throw error; } });
  editor.update(() => { $getRoot().append($createParagraphNode()); }, {discrete: true});
  return editor;
}

describe("Lexical Automerge binding", () => {
  it("persists the initial state and updates the document", () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create(createLexicalAutomergeDocument(editor.getEditorState().toJSON()));
    const binding = bindLexicalToAutomerge(editor, handle);
    editor.update(() => { /* a discrete update is enough to exercise serialization */ }, {discrete: true});
    expect(handle.docSync()?.schemaVersion).toBe(2);
    expect(handle.docSync()?.revision).toBeGreaterThanOrEqual(1);
    binding.dispose();
  });

  it("applies remote state and does not throw when disposed twice", async () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create(createLexicalAutomergeDocument(editor.getEditorState().toJSON()));
    const binding = bindLexicalToAutomerge(editor, handle);
    handle.change((doc) => {
      doc.root.direction = "ltr";
      doc.revision++;
      doc.revision++;
    });
    await new Promise<void>((resolve) => editor.update(resolve, {discrete: true}));
    expect(editor.getEditorState().toJSON().root.direction).toBe("ltr");
    binding.dispose();
    binding.dispose();
  });

  it("reconciles a new top-level block without replacing the root", () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create(createLexicalAutomergeDocument(editor.getEditorState().toJSON()));
    const binding = bindLexicalToAutomerge(editor, handle);
    handle.change((doc) => {
      const id = `new-${doc.order.length}`;
      doc.order.push(id);
      doc.blocks[id] = { type: "paragraph", text: "", attributes: {}, node: { children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1, blockId: id } };
      doc.revision++;
    });
    expect(editor.getEditorState().toJSON().root.children).toHaveLength(2);
    binding.dispose();
  });

  it("ignores updates tagged as remote and persists other edits", () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create(createLexicalAutomergeDocument(editor.getEditorState().toJSON()));
    const binding = bindLexicalToAutomerge(editor, handle, { remoteUpdateTag: "custom-sync" });
    const before = handle.docSync()?.revision ?? 0;
    editor.update(() => {
      const paragraph = $getRoot().getFirstChild();
      if ($isElementNode(paragraph)) paragraph.append($createTextNode("tagged"));
    }, { discrete: true, tag: "custom-sync" });
    expect(handle.docSync()?.revision).toBe(before);
    editor.update(() => {
      const paragraph = $getRoot().getFirstChild();
      const text = $isElementNode(paragraph) ? paragraph.getFirstChild() : null;
      if ($isTextNode(text)) text.spliceText(0, text.getTextContentSize(), "local");
    }, { discrete: true });
    const doc = handle.docSync();
    expect(doc?.blocks[doc.order[0]]?.text).toBe("local");
    expect(doc?.revision).toBeGreaterThan(before);
    binding.dispose();
  });
});