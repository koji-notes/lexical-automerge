import { describe, expect, it, vi } from "vitest";
import { createEditor } from "lexical";
import { bindPresence, PEER_PRESENCE_COMMAND } from "../src/presence";

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
});
