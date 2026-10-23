import type { LexicalEditor } from "lexical";
import { $getNodeByKey, $getSelection } from "lexical";
import { PEER_PRESENCE_COMMAND, type PeerPresence } from "./constants";

export { PEER_PRESENCE_COMMAND };
export interface PresenceHandle {
  broadcast(message: unknown): void;
  on(event: "ephemeral-message", listener: (payload: { message: unknown; senderId: string }) => void): unknown;
  off(event: "ephemeral-message", listener: (payload: { message: unknown; senderId: string }) => void): unknown;
}
export type PresenceMessage = { type: "presence"; presence: PeerPresence };

export function publishPresence(editor: LexicalEditor, handle: PresenceHandle, presence: PeerPresence): void {
  handle.broadcast({ type: "presence", presence } satisfies PresenceMessage);
}

export function bindPresence(editor: LexicalEditor, handle: PresenceHandle, onPresence: (presence: PeerPresence) => void): () => void {
  let receiving = false;
  const receive = (payload: { message: unknown; senderId: string }) => {
    const message = payload.message as Partial<PresenceMessage>;
    if (message.type === "presence" && message.presence) {
      const presence = { ...message.presence, peerId: message.presence.peerId || payload.senderId };
      receiving = true;
      try {
        editor.dispatchCommand(PEER_PRESENCE_COMMAND, presence);
      } finally {
        receiving = false;
      }
      onPresence(presence);
    }
  };
  const unregister = editor.registerCommand(PEER_PRESENCE_COMMAND, (presence) => {
    if (!receiving) publishPresence(editor, handle, presence);
    return true;
  }, 1);
  handle.on("ephemeral-message", receive);
  return () => { unregister(); handle.off("ephemeral-message", receive); };
}

export function selectionPresence(editor: LexicalEditor, peerId: string): PeerPresence {
  let result: PeerPresence = { peerId };
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (selection && "anchor" in selection && "focus" in selection) {
      const range = selection as { anchor: { key: string; offset: number }; focus: { key: string; offset: number } };
      const point = (key: string, offset: number) => {
        const node = $getNodeByKey(key);
        let block = node;
        while (block?.getParent() && block.getParent()?.getType() !== "root") block = block.getParent();
        const record = block as unknown as Record<string, unknown> | null;
        const blockId = record?.__blockId ?? record?.blockId;
        const textIndex = block ? (block as import("lexical").ElementNode).getAllTextNodes().findIndex((text) => text.getKey() === key) : -1;
        return { blockId: typeof blockId === "string" ? blockId : undefined, textIndex, offset };
      };
      const anchor = point(range.anchor.key, range.anchor.offset);
      const focus = point(range.focus.key, range.focus.offset);
      result = { ...result, anchorBlockId: anchor.blockId, anchorTextIndex: anchor.textIndex, anchorOffset: anchor.offset, focusBlockId: focus.blockId, focusTextIndex: focus.textIndex, focusOffset: focus.offset };
    }
  });
  return result;
}
