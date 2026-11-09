import { describe, expect, it, vi } from "vitest";
import { $createParagraphNode, $createRangeSelection, $createTextNode, $getRoot, $setSelection, createEditor } from "lexical";
import { bindPresence, PEER_PRESENCE_COMMAND, selectionPresence } from "../src/presence";
import { serializeWithStableBlockIds } from "../src/reconciler";

describe("presence", () => {
  it("dispatches received presence without rebroadcasting", () => {
    const editor = createEditor({
      namespace: "presence",
      onError: (error) => {
        throw error;
      },
    });
    const listeners: ((payload: {
      message: unknown;
      senderId: string;
    }) => void)[] = [];
    const handle = {
      broadcast: vi.fn(),
      on: (
        _event: string,
        listener: (payload: { message: unknown; senderId: string }) => void,
      ) => {
        listeners.push(listener);
      },
      off: vi.fn(),
    };
    const received = vi.fn();
    const command = vi.fn();
    editor.registerCommand(PEER_PRESENCE_COMMAND, command, 1);
    const dispose = bindPresence(editor, handle, received);
    listeners[0]({
      senderId: "peer-2",
      message: {
        type: "presence",
        presence: { peerId: "peer-2", color: "blue" },
      },
    });
    expect(received).toHaveBeenCalledWith({ peerId: "peer-2", color: "blue" });
    expect(command).toHaveBeenCalled();
    expect(handle.broadcast).not.toHaveBeenCalled();
    dispose();
  });

  it("reports the persisted block id for the current selection", () => {
    const editor = createEditor({ namespace: "presence-selection", onError: (error) => { throw error; } });
    editor.update(() => {
      const paragraph = $createParagraphNode();
      const text = $createTextNode("hello");
      paragraph.append(text);
      $getRoot().append(paragraph);
      const selection = $createRangeSelection();
      selection.anchor.set(text.getKey(), 1, "text");
      selection.focus.set(text.getKey(), 1, "text");
      $setSelection(selection);
    }, { discrete: true });
    const state = serializeWithStableBlockIds(editor);
    const blockId = (state.root.children[0] as unknown as { blockId: string }).blockId;
    expect(selectionPresence(editor, "peer-1").anchorBlockId).toBe(blockId);
  });
});
