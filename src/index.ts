export type {
  BindingOptions,
  EditorState,
  LexicalAutomergeBinding,
  LexicalAutomergeDocument,
  LexicalBlockRecord,
  SerializedState,
} from "./types";
export { DOCUMENT_SCHEMA_VERSION } from "./types";
export {
  bindLexicalToAutomerge,
  createLexicalAutomergeBinding,
  createLexicalAutomergeDocument,
} from "./binding";
export {
  $createAutomergeBlockNode,
  $isAutomergeBlockNode,
  AutomergeBlockNode,
} from "./blocknodes";
export type { SerializedAutomergeBlockNode } from "./blocknodes";
export {
  AUTOMERGE_SYNC_TAG,
  BLOCK_ID_FIELD,
  PEER_PRESENCE_COMMAND,
} from "./constants";
export type { PeerPresence } from "./constants";
export {
  documentFromEditorState,
  editorStateFromDocument,
  migrateDocument,
  syncDocument,
  validateDocument,
} from "./persistence";
export {
  bindPresence,
  PresenceStore,
  publishPresence,
  selectionPresence,
} from "./presence";
export type { PresenceHandle, PresenceMessage, PresenceStoreOptions } from "./presence";
