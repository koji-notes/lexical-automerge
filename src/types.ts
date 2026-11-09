import type { DocHandle } from "@automerge/automerge-repo";
import type { EditorState, ElementFormatType, LexicalEditor, SerializedEditorState } from "lexical";

export const DOCUMENT_SCHEMA_VERSION = 2;
export interface LexicalBlockRecord {
  type: string;
  text: string;
  attributes: Record<string, string | number | boolean | null>;
  node: Record<string, unknown>;
}
export interface LexicalAutomergeDocument {
  schemaVersion: 2;
  order: string[];
  blocks: Record<string, LexicalBlockRecord>;
  root: { direction: "ltr" | "rtl" | null; format: ElementFormatType; indent: number };
  revision: number;
}

export interface BindingOptions {
  preserveInitialState?: boolean;
  remoteUpdateTag?: string;
  onError?: (error: Error) => void;
  onChange?: (revision: number) => void;
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