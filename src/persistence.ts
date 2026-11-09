import type { SerializedEditorState, SerializedLexicalNode } from "lexical";
import { BLOCK_ID_FIELD, createBlockId } from "./constants";
import { surgicalSplice } from "./diff";
import { DOCUMENT_SCHEMA_VERSION, type LexicalAutomergeDocument, type LexicalBlockRecord } from "./types";

export function validateDocument(value: unknown): value is LexicalAutomergeDocument {
  if (!value || typeof value !== "object") return false;
  const doc = value as Partial<LexicalAutomergeDocument>;
  return doc.schemaVersion === DOCUMENT_SCHEMA_VERSION && Array.isArray(doc.order) &&
    !!doc.blocks && typeof doc.blocks === "object" && typeof doc.revision === "number" &&
    !!doc.root && (doc.root.direction === null || doc.root.direction === "ltr" || doc.root.direction === "rtl") &&
    doc.order.every((id) => typeof id === "string" && !!(doc.blocks as Record<string, unknown>)[id]);
}

function blockFromNode(node: SerializedLexicalNode, blockId: string): LexicalBlockRecord {
  const value = node as unknown as Record<string, unknown>;
  return {
    type: node.type,
    text: typeof value.text === "string" ? value.text : extractText(node),
    attributes: Object.fromEntries(Object.entries(value).filter(([key, item]) =>
      !["children", "text", "type", "version", BLOCK_ID_FIELD].includes(key) &&
      (item === null || ["string", "number", "boolean"].includes(typeof item)))) as Record<string, string | number | boolean | null>,
    node: { ...value, [BLOCK_ID_FIELD]: blockId },
  };
}

function extractText(node: SerializedLexicalNode): string {
  const value = node as unknown as { text?: string; children?: SerializedLexicalNode[] };
  return typeof value.text === "string" ? value.text : (value.children ?? []).map(extractText).join("");
}

function stable(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>).sort().map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

function cloneBlock(block: LexicalBlockRecord): LexicalBlockRecord {
  return {
    type: block.type,
    text: block.text,
    attributes: { ...block.attributes },
    node: structuredClone(block.node),
  };
}

function sameBlock(current: LexicalBlockRecord, next: LexicalBlockRecord): boolean {
  return current.type === next.type && current.text === next.text &&
    stable(current.attributes) === stable(next.attributes) &&
    stable(current.node) === stable(next.node);
}

export function documentFromEditorState(state: SerializedEditorState): LexicalAutomergeDocument {
  const order: string[] = [];
  const blocks: Record<string, LexicalBlockRecord> = {};
  const seen = new Set<string>();
  state.root.children.forEach((node) => {
    const value = node as unknown as Record<string, unknown>;
    const candidate = value[BLOCK_ID_FIELD];
    let id = typeof candidate === "string" && candidate ? candidate : createBlockId();
    if (seen.has(id)) id = createBlockId();
    seen.add(id);
    order.push(id);
    blocks[id] = blockFromNode(node, id);
  });
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    order,
    blocks,
    root: { direction: state.root.direction, format: state.root.format, indent: state.root.indent },
    revision: 1,
  };
}

export function editorStateFromDocument(doc: LexicalAutomergeDocument): SerializedEditorState {
  const children = doc.order.map((id) => doc.blocks[id]?.node).filter(Boolean) as unknown as SerializedLexicalNode[];
  return {
    root: { type: "root", version: 1, children, direction: doc.root.direction, format: doc.root.format, indent: doc.root.indent },
  } as SerializedEditorState;
}

export function migrateDocument(value: unknown): LexicalAutomergeDocument | null {
  if (validateDocument(value)) return value;
  const legacy = value as { editorState?: SerializedEditorState; revision?: number } | null;
  if (legacy?.editorState?.root?.children) {
    const result = documentFromEditorState(legacy.editorState);
    result.revision = legacy.revision ?? 1;
    return result;
  }
  return null;
}

/**
 * Write `next` into an Automerge document without replacing `blocks` or `order`.
 * Returns true when the document changed. `revision` is left to the caller.
 */
export function syncDocument(doc: LexicalAutomergeDocument, next: LexicalAutomergeDocument): boolean {
  if (!validateDocument(doc)) {
    installDocument(doc, next);
    return true;
  }
  let changed = false;
  if (doc.root.direction !== next.root.direction) {
    doc.root.direction = next.root.direction;
    changed = true;
  }
  if (doc.root.format !== next.root.format) {
    doc.root.format = next.root.format;
    changed = true;
  }
  if (doc.root.indent !== next.root.indent) {
    doc.root.indent = next.root.indent;
    changed = true;
  }
  const nextIds = new Set(next.order);
  for (const id of next.order) {
    const incoming = next.blocks[id];
    if (!incoming) continue;
    const current = doc.blocks[id];
    if (!current || !sameBlock(current, incoming)) {
      doc.blocks[id] = cloneBlock(incoming);
      changed = true;
    }
  }
  const currentOrder = [...doc.order];
  if (stable(currentOrder) !== stable(next.order)) {
    const delta = surgicalSplice(currentOrder, next.order, Object.is);
    doc.order.splice(delta.index, delta.deleteCount, ...delta.insert);
    changed = true;
  }
  for (const id of Object.keys(doc.blocks)) {
    if (!nextIds.has(id)) {
      delete doc.blocks[id];
      changed = true;
    }
  }
  return changed;
}

function installDocument(doc: LexicalAutomergeDocument, next: LexicalAutomergeDocument): void {
  const prior = (doc as { revision?: unknown }).revision;
  const legacy = doc as { editorState?: unknown };
  if ("editorState" in legacy) delete legacy.editorState;
  doc.schemaVersion = next.schemaVersion;
  doc.order = [...next.order];
  doc.blocks = {};
  for (const id of next.order) {
    const block = next.blocks[id];
    if (block) doc.blocks[id] = cloneBlock(block);
  }
  doc.root = { direction: next.root.direction, format: next.root.format, indent: next.root.indent };
  doc.revision = typeof prior === "number" ? prior : next.revision;
}
