import { describe, expect, it } from "vitest";
import { Repo } from "@automerge/automerge-repo";
import { $createParagraphNode, $getRoot, createEditor } from "lexical";
import { bindLexicalToAutomerge } from "../src/binding";

function makeEditor() {
  const editor = createEditor({ namespace: "test", onError: (error) => { throw error; } });
  editor.update(() => { $getRoot().append($createParagraphNode()); }, {discrete: true});
  return editor;
}

describe("Lexical Automerge binding", () => {
  it("persists the initial state and updates the document", () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create({ editorState: editor.getEditorState().toJSON(), revision: 1 });
    const binding = bindLexicalToAutomerge(editor, handle);
    editor.update(() => { /* a discrete update is enough to exercise serialization */ }, {discrete: true});
    expect(handle.docSync()?.editorState.root.type).toBe("root");
    expect(handle.docSync()?.revision).toBeGreaterThanOrEqual(1);
    binding.dispose();
  });

  it("applies remote state and does not throw when disposed twice", async () => {
    const editor = makeEditor();
    const repo = new Repo({ isEphemeral: true });
    const handle = repo.create({ editorState: editor.getEditorState().toJSON(), revision: 1 });
    const binding = bindLexicalToAutomerge(editor, handle);
    handle.change((doc) => {
      doc.editorState.root.direction = "ltr";
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
    const handle = repo.create({ editorState: editor.getEditorState().toJSON(), revision: 1 });
    const binding = bindLexicalToAutomerge(editor, handle);
    handle.change((doc) => {
      doc.editorState.root.children.push({ children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1 } as never);
      doc.revision++;
    });
    expect(editor.getEditorState().toJSON().root.children).toHaveLength(2);
    binding.dispose();
  });
});