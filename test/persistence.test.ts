import { describe, expect, it } from "vitest";
import { createLexicalAutomergeDocument } from "../src/binding";
import { editorStateFromDocument, migrateDocument, validateDocument } from "../src/persistence";

const state = { root: { children: [{ type: "paragraph", version: 1, children: [], direction: null, format: "", indent: 0 }], direction: null, format: "", indent: 0, type: "root", version: 1 } } as never;

describe("versioned persistence", () => {
  it("stores granular order and blocks and round trips", () => {
    const doc = createLexicalAutomergeDocument(state);
    expect(doc.schemaVersion).toBe(2);
    expect(doc.order).toHaveLength(1);
    expect(doc.order[0]).not.toMatch(/^block-\d+$/);
    expect(validateDocument(doc)).toBe(true);
    expect(editorStateFromDocument(doc).root.children).toHaveLength(1);
  });
  it("migrates legacy editorState documents and rejects invalid values", () => {
    const migrated = migrateDocument({ editorState: state, revision: 4 });
    expect(migrated?.schemaVersion).toBe(2);
    expect(migrateDocument({ nope: true })).toBeNull();
  });
});
