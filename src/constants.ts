import { createCommand } from "lexical";

export const AUTOMERGE_SYNC_TAG = "automerge-sync";
export const BLOCK_ID_FIELD = "blockId";
export const PEER_PRESENCE_COMMAND = createCommand<PeerPresence>("peer-presence");

export interface PeerPresence {
  peerId: string;
  name?: string;
  color?: string;
  anchorBlockId?: string;
  anchorTextIndex?: number;
  anchorOffset?: number;
  focusBlockId?: string;
  focusTextIndex?: number;
  focusOffset?: number;
}
