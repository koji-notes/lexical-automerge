import type { LexicalEditor } from "lexical";
import { $getNodeByKey, $getSelection } from "lexical";
import { PEER_PRESENCE_COMMAND, type PeerPresence } from "./constants";
import { blockIdForKey, serializeWithStableBlockIds } from "./reconciler";

export { PEER_PRESENCE_COMMAND };
export interface PresenceHandle {
  broadcast(message: unknown): void;
  on(event: "ephemeral-message", listener: (payload: { message: unknown; senderId: string }) => void): unknown;
  off(event: "ephemeral-message", listener: (payload: { message: unknown; senderId: string }) => void): unknown;
}
export type PresenceMessage = { type: "presence"; presence: PeerPresence };

export interface PresenceStoreOptions {
  expirationMs?: number;
  throttleMs?: number;
  onChange?: (peers: readonly PeerPresence[]) => void;
}

export class PresenceStore {
  private readonly peers = new Map<string, { value: PeerPresence; expiresAt: number }>();
  private readonly expirationMs: number;
  private readonly throttleMs: number;
  private readonly onChange?: (peers: readonly PeerPresence[]) => void;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private lastSent = 0;
  constructor(private readonly handle: PresenceHandle, options: PresenceStoreOptions = {}) {
    this.expirationMs = options.expirationMs ?? 30_000;
    this.throttleMs = options.throttleMs ?? 50;
    this.onChange = options.onChange;
  }
  receive(presence: PeerPresence): void {
    this.peers.set(presence.peerId, { value: presence, expiresAt: Date.now() + this.expirationMs });
    this.scheduleCleanup();
    this.onChange?.([...this.peers.values()].map((entry) => entry.value));
  }
  publish(presence: PeerPresence, throttleMs = this.throttleMs): boolean {
    const now = Date.now();
    if (now - this.lastSent < throttleMs) return false;
    this.lastSent = now;
    publishPresence(undefined as never, this.handle, presence);
    return true;
  }
  get(peerId: string): PeerPresence | undefined {
    return this.peers.get(peerId)?.value;
  }
  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.peers.clear();
    this.onChange?.([]);
  }
  private scheduleCleanup(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      const now = Date.now();
      for (const [id, entry] of this.peers) if (entry.expiresAt <= now) this.peers.delete(id);
      this.onChange?.([...this.peers.values()].map((entry) => entry.value));
      if (this.peers.size) this.scheduleCleanup();
    }, this.expirationMs);
  }
}

export function publishPresence(editor: LexicalEditor | undefined, handle: PresenceHandle, presence: PeerPresence): void {
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
  serializeWithStableBlockIds(editor);
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (selection && "anchor" in selection && "focus" in selection) {
      const range = selection as { anchor: { key: string; offset: number }; focus: { key: string; offset: number } };
      const point = (key: string, offset: number) => {
        const node = $getNodeByKey(key);
        let block = node;
        while (block?.getParent() && block.getParent()?.getType() !== "root") block = block.getParent();
        const blockId = block ? blockIdForKey(editor, block.getKey()) : undefined;
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
