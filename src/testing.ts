import { createEditor } from "lexical";
import type { LexicalEditor } from "lexical";
import { $createParagraphNode, $getRoot } from "lexical";

export function createTestEditor(namespace = "lexical-automerge-test"): LexicalEditor {
  const editor = createEditor({ namespace, onError: (error) => { throw error; } });
  editor.update(() => $getRoot().append($createParagraphNode()), { discrete: true });
  return editor;
}
