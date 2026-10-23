import { Repo } from "@automerge/automerge-repo";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { AutoMergePlugin } from "../src/react/auto-merge-plugin";
import type { LexicalAutomergeDocument } from "../src/types";

const repo = new Repo({ isEphemeral: true });
const initial: LexicalAutomergeDocument = {
  editorState: { root: { children: [{ children: [], direction: null, format: "", indent: 0, type: "paragraph", version: 1 }], direction: null, format: "", indent: 0, type: "root", version: 1 } },
  revision: 1,
};
const handle = repo.create(initial);
export function App() {
  return <LexicalComposer initialConfig={{ namespace: "lexical-automerge-playground", onError: console.error }}>
    <RichTextPlugin contentEditable={<ContentEditable aria-label="Note" />} placeholder={<p>Write a note…</p>} ErrorBoundary={({ children }) => <>{children}</>} />
    <AutoMergePlugin handle={handle} />
  </LexicalComposer>;
}
