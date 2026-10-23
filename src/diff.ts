import { BLOCK_ID_FIELD } from "./constants";
import type { SerializedEditorState } from "lexical";

export interface Splice<T> {
  index: number;
  deleteCount: number;
  insert: T[];
}
export interface SpliceDelta {
  index: number;
  deleteCount: number;
  insertText: string;
}

export function spliceString(before: string, after: string): SpliceDelta {
  let index = 0;
  while (index < before.length && index < after.length && before[index] === after[index]) index++;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > index && afterEnd > index && before[beforeEnd - 1] === after[afterEnd - 1]) {
    beforeEnd--; afterEnd--;
  }
  return { index, deleteCount: beforeEnd - index, insertText: after.slice(index, afterEnd) };
}

/** Returns the smallest prefix/suffix splice that transforms `before` into `after`. */
export function surgicalSplice<T>(
  before: readonly T[], after: readonly T[], equal: (a: T, b: T) => boolean = Object.is,
): Splice<T> {
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && equal(before[prefix], after[prefix])) prefix++;
  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (beforeEnd > prefix && afterEnd > prefix && equal(before[beforeEnd - 1], after[afterEnd - 1])) {
    beforeEnd--; afterEnd--;
  }
  return { index: prefix, deleteCount: beforeEnd - prefix, insert: after.slice(prefix, afterEnd) };
}

export function blockId(node: { [key: string]: unknown }, fallback: string): string {
  return typeof node[BLOCK_ID_FIELD] === "string" && node[BLOCK_ID_FIELD] ? node[BLOCK_ID_FIELD] as string : fallback;
}

export function topLevelSplice(before: SerializedEditorState, after: SerializedEditorState): Splice<unknown> {
  const oldChildren = before.root.children;
  const newChildren = after.root.children;
  return surgicalSplice(oldChildren, newChildren, (a, b) =>
    blockId(a as Record<string, unknown>, "") === blockId(b as Record<string, unknown>, "") &&
    JSON.stringify(a) === JSON.stringify(b));
}
