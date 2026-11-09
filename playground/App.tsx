import { Repo } from "@automerge/automerge-repo";
import { $createParagraphNode, $getRoot, createEditor } from "lexical";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { createLexicalAutomergeDocument } from "../src/binding";
import { AutoMergePlugin } from "../src/react/auto-merge-plugin";

const repo = new Repo({ isEphemeral: true });
const seed = createEditor({ namespace: "lexical-automerge-playground", onError: console.error });
seed.update(() => { $getRoot().append($createParagraphNode()); }, { discrete: true });
const handle = repo.create(createLexicalAutomergeDocument(seed.getEditorState().toJSON()));

export function App() {
  return <LexicalComposer initialConfig={{ namespace: "lexical-automerge-playground", onError: console.error }}>
    <RichTextPlugin contentEditable={<ContentEditable aria-label="Note" />} placeholder={<p>Write a note…</p>} ErrorBoundary={({ children }) => <>{children}</>} />
    <AutoMergePlugin handle={handle} />
  </LexicalComposer>;
}
