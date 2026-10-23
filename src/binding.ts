import type { DocHandle } from "@automerge/automerge-repo";
import type {
  EditorState,
  LexicalEditor,
  SerializedEditorState,
} from "lexical";
import type {
  BindingOptions,
  LexicalAutomergeBinding,
  LexicalAutomergeDocument,
} from "./types";
import {
  reconcileEditorState,
  serializeWithStableBlockIds,
} from "./reconciler";
function stateToJSON(state: EditorState): SerializedEditorState {
  return state.toJSON() as SerializedEditorState;
}
function cloneState(state: SerializedEditorState): SerializedEditorState {
  return JSON.parse(JSON.stringify(state)) as SerializedEditorState;
}
function hasState(
  value: LexicalAutomergeDocument | undefined,
): value is LexicalAutomergeDocument {
  return (
    !!value?.editorState?.root && Array.isArray(value.editorState.root.children)
  );
}

export function bindLexicalToAutomerge(
  editor: LexicalEditor,
  handle: DocHandle<LexicalAutomergeDocument>,
  options: BindingOptions = {},
): LexicalAutomergeBinding {
  let disposed = false;
  const apply = (document: LexicalAutomergeDocument | undefined): void => {
    if (disposed || !hasState(document)) return;
    reconcileEditorState(editor, document.editorState);
  };
  const initial = handle.docSync();
  if (hasState(initial)) apply(initial);
  else if (!options.preserveInitialState) {
    handle.change((doc) => {
      doc.editorState = cloneState(serializeWithStableBlockIds(editor));
      doc.revision = 1;
    });
  }
  const unregisterEditor = editor.registerUpdateListener(
    ({ editorState, tags }) => {
      if (disposed || tags.has("automerge-sync")) return;
      const serialized = serializeWithStableBlockIds(editor);
      handle.change((doc) => {
        doc.editorState = cloneState(serialized);
        doc.revision = (doc.revision ?? 0) + 1;
      });
    },
  );
  const onChange = ({ doc }: { doc: LexicalAutomergeDocument }): void =>
    apply(doc);
  handle.on("change", onChange);
  return {
    editor,
    handle,
    flush() {
      if (disposed) return;
      const serialized = serializeWithStableBlockIds(editor);
      handle.change((doc) => {
        doc.editorState = cloneState(serialized);
        doc.revision = (doc.revision ?? 0) + 1;
      });
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
  return { editorState, revision: 1 };
}
