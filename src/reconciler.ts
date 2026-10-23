import type { ElementNode, LexicalEditor, LexicalNode, SerializedEditorState, SerializedLexicalNode } from "lexical";
import { $createRangeSelection, $getNodeByKey, $getSelection, $getRoot, $setSelection, $isTextNode } from "lexical";
import { AUTOMERGE_SYNC_TAG, BLOCK_ID_FIELD } from "./constants";
import { surgicalSplice, spliceString } from "./diff";

const blockIdsByEditor = new WeakMap<LexicalEditor, Map<string, string>>();

function editorBlockIds(editor: LexicalEditor): Map<string, string> {
  let ids = blockIdsByEditor.get(editor);
  if (!ids) {
    ids = new Map();
    blockIdsByEditor.set(editor, ids);
  }
  return ids;
}

function uuid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function ensureStableBlockIds(state: SerializedEditorState): SerializedEditorState {
  const seen = new Set<string>();
  const children = state.root.children.map((child) => {
    const candidate = (child as Record<string, unknown>)[BLOCK_ID_FIELD];
    const id = typeof candidate === "string" && candidate && !seen.has(candidate) ? candidate : uuid();
    seen.add(id);
    return { ...(child as Record<string, unknown>), [BLOCK_ID_FIELD]: id };
  });
  return { ...state, root: { ...state.root, children } as unknown as typeof state.root };
}

export function serializeWithStableBlockIds(editor: LexicalEditor): SerializedEditorState {
  const state = editor.getEditorState();
  const serialized = state.toJSON() as SerializedEditorState;
  const ids = editorBlockIds(editor);
  state.read(() => {
    $getRoot().getChildren().forEach((node, index) => {
      const current = ids.get(node.getKey());
      const candidate = (serialized.root.children[index] as Record<string, unknown>)[BLOCK_ID_FIELD];
      ids.set(node.getKey(), typeof candidate === "string" && candidate ? candidate : current ?? uuid());
      (serialized.root.children[index] as Record<string, unknown>)[BLOCK_ID_FIELD] = ids.get(node.getKey());
    });
  });
  return serialized;
}

interface PointSnapshot { blockId: string; textIndex: number; offset: number; }
interface SelectionSnapshot { anchor: PointSnapshot; focus: PointSnapshot; backward?: boolean; }

function snapshotSelection(editor: LexicalEditor): SelectionSnapshot | null {
  const selection = $getSelection();
  if (!selection || !("anchor" in selection) || !("focus" in selection)) return null;
  const point = (p: { key: string; offset: number }): PointSnapshot | null => {
    const node = $getNodeByKey(p.key);
    if (!node) return null;
    let top: LexicalNode = node;
    while (top.getParent() && top.getParent()?.getType() !== "root") top = top.getParentOrThrow();
    const blockId = editorBlockIds(editor).get(top.getKey());
    if (typeof blockId !== "string") return null;
    const textNodes = (top as ElementNode).getAllTextNodes();
    return { blockId, textIndex: Math.max(0, textNodes.findIndex((n) => n.getKey() === p.key)), offset: p.offset };
  };
  const range = selection as unknown as { anchor: { key: string; offset: number }; focus: { key: string; offset: number }; isBackward?: () => boolean };
  const anchor = point(range.anchor); const focus = point(range.focus);
  return anchor && focus ? { anchor, focus, backward: range.isBackward?.() } : null;
}

function nodeForSerialized(editor: LexicalEditor, serialized: SerializedLexicalNode): LexicalNode {
  const registered = (editor as unknown as { _nodes: Map<string, { klass: { importJSON: (value: never) => LexicalNode } }> })._nodes;
  const entry = registered?.get(serialized.type);
  if (!entry?.klass.importJSON) throw new Error(`Lexical node type "${serialized.type}" is not registered`);
  const node = entry.klass.importJSON(serialized as never);
  const children = (serialized as unknown as { children?: SerializedLexicalNode[] }).children;
  if (children && "append" in node) {
    const parent = node as unknown as { append: (...nodes: LexicalNode[]) => void };
    parent.append(...children.map((child) => nodeForSerialized(editor, child)));
  }
  return node;
}

function patchText(current: LexicalNode, incoming: SerializedLexicalNode): void {
  if ($isTextNode(current) && incoming.type === "text") {
    const text = (incoming as unknown as { text?: string }).text ?? "";
    const delta = spliceString(current.getTextContent(), text);
    if (delta.deleteCount || delta.insertText) current.spliceText(delta.index, delta.deleteCount, delta.insertText);
    return;
  }
  const incomingChildren = (incoming as unknown as { children?: SerializedLexicalNode[] }).children;
  if (!incomingChildren) return;
  const currentChildren = (current as ElementNode).getChildren();
  if (currentChildren.length !== incomingChildren.length) return;
  currentChildren.forEach((child, index) => patchText(child, incomingChildren[index]));
}

function restoreSelection(editor: LexicalEditor, snapshot: SelectionSnapshot | null): void {
  if (!snapshot) return;
  const locate = (point: PointSnapshot) => {
    const root = $getRoot();
    const block = root.getChildren().find((node) => editorBlockIds(editor).get(node.getKey()) === point.blockId);
    const text = block ? (block as ElementNode).getAllTextNodes()[point.textIndex] : undefined;
    return text ? { key: text.getKey(), offset: Math.min(point.offset, text.getTextContentSize()) } : null;
  };
  const anchor = locate(snapshot.anchor); const focus = locate(snapshot.focus);
  if (!anchor || !focus) return;
  const selection = $createRangeSelection();
  selection.anchor.set(anchor.key, anchor.offset, "text");
  selection.focus.set(focus.key, focus.offset, "text");
  $setSelection(selection);
}

export function reconcileEditorState(editor: LexicalEditor, incoming: SerializedEditorState): void {
  const normalized = ensureStableBlockIds(incoming);
  let selection: SelectionSnapshot | null = null;
  editor.getEditorState().read(() => { selection = snapshotSelection(editor); });
  editor.update(() => {
    const root = $getRoot();
    const current = root.getChildren();
    const ids = editorBlockIds(editor);
    const byId = new Map(current.map((node) => [ids.get(node.getKey()), node]));
    const desired = normalized.root.children;
    current.forEach((node, index) => {
      if (!ids.has(node.getKey()) && desired[index]) {
        const candidate = (desired[index] as Record<string, unknown>)[BLOCK_ID_FIELD];
        if (typeof candidate === "string") ids.set(node.getKey(), candidate);
      }
    });
    const existingIds = current.map((node) => ids.get(node.getKey()));
    const desiredIds = desired.map((node) => (node as Record<string, unknown>)[BLOCK_ID_FIELD]);
    const delta = surgicalSplice(existingIds, desiredIds, Object.is);
    for (let i = 0; i < delta.deleteCount; i++) current[delta.index + i]?.remove();
    const nodes = root.getChildren();
    for (let i = delta.index; i < delta.index + delta.insert.length; i++) {
      const node = nodeForSerialized(editor, desired[i] as SerializedLexicalNode);
      ids.set(node.getKey(), (desired[i] as Record<string, unknown>)[BLOCK_ID_FIELD] as string);
      const before = nodes[i - 1];
      if (before) before.insertAfter(node); else root.append(node);
    }
    desired.forEach((serialized, index) => {
      const old = byId.get((serialized as Record<string, unknown>)[BLOCK_ID_FIELD] as string);
      const next = root.getChildren()[index];
      if (old && next && old.getType() === next.getType()) patchText(next, serialized);
    });
    root.setDirection(normalized.root.direction);
    root.getChildren().forEach((node, index) => ids.set(node.getKey(), (desired[index] as Record<string, unknown>)[BLOCK_ID_FIELD] as string));
    restoreSelection(editor, selection);
  }, { tag: AUTOMERGE_SYNC_TAG, discrete: true });
}
