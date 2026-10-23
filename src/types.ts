import type { DocHandle } from "@automerge/automerge-repo";
import type { EditorState, LexicalEditor, SerializedEditorState } from "lexical";

/** The value persisted in an Automerge document. */
export interface LexicalAutomergeDocument {
  /** Lexical's stable JSON representation. */
  editorState: SerializedEditorState;
  /** Monotonically increasing local write counter (useful for diagnostics). */
  revision: number;
}

export interface BindingOptions {
  /** Do not replace the editor's initial state when the document is empty. */
  preserveInitialState?: boolean;
  /** Tag applied to updates originating from Automerge. */
  remoteUpdateTag?: string;
}

export interface LexicalAutomergeBinding {
  readonly editor: LexicalEditor;
  readonly handle: DocHandle<LexicalAutomergeDocument>;
  /** Stop listening to both Lexical and Automerge. */
  dispose(): void;
  /** Persist the current editor state immediately. */
  flush(): void;
}

export type SerializedState = SerializedEditorState;
export type { EditorState };