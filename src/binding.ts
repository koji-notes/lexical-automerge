import type { DocHandle } from "@automerge/automerge-repo";
import type { LexicalEditor, SerializedEditorState } from "lexical";
import { AUTOMERGE_SYNC_TAG } from "./constants";
import type {
  BindingOptions,
  LexicalAutomergeBinding,
  LexicalAutomergeDocument,
} from "./types";
import {
  reconcileEditorState,
  serializeWithStableBlockIds,
} from "./reconciler";
import { documentFromEditorState, editorStateFromDocument, migrateDocument, syncDocument } from "./persistence";

export function bindLexicalToAutomerge(
  editor: LexicalEditor,
  handle: DocHandle<LexicalAutomergeDocument>,
  options: BindingOptions = {},
): LexicalAutomergeBinding {
  let disposed = false;
  const remoteTag = options.remoteUpdateTag ?? AUTOMERGE_SYNC_TAG;
  const change = (operation: (doc: LexicalAutomergeDocument) => void): void => {
    try {
      handle.change(operation);
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };
  const apply = (document: unknown): void => {
    if (disposed) return;
    const migrated = migrateDocument(document);
    if (!migrated) {
      options.onError?.(new Error("Invalid Automerge document"));
      return;
    }
    reconcileEditorState(editor, editorStateFromDocument(migrated), remoteTag);
  };
  const write = (increment: boolean): void => {
    const next = documentFromEditorState(serializeWithStableBlockIds(editor));
    change((doc) => {
      if (!syncDocument(doc, next)) return;
      if (increment) doc.revision = (doc.revision ?? 0) + 1;
    });
  };
  const initial = handle.docSync();
  if (initial) apply(initial);
  else if (!options.preserveInitialState) write(false);
  const unregisterEditor = editor.registerUpdateListener(({ tags }) => {
    if (disposed || tags.has(remoteTag)) return;
    write(true);
  });
  const onChange = ({ doc }: { doc: LexicalAutomergeDocument }): void => {
    apply(doc);
    options.onChange?.(doc.revision);
  };
  handle.on("change", onChange);
  return {
    editor,
    handle,
    flush() {
      if (disposed) return;
      write(true);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unregisterEditor();
      handle.off("change", onChange);
    },
  };
}

export const createLexicalAutomergeBinding = bindLexicalToAutomerge;
export function createLexicalAutomergeDocument(
  editorState: SerializedEditorState,
): LexicalAutomergeDocument {
  return documentFromEditorState(editorState);
}
