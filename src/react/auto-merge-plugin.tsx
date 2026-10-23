import { useEffect } from "react";
import type { DocHandle } from "@automerge/automerge-repo";
import type { LexicalEditor } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { bindLexicalToAutomerge } from "../binding";
import type { BindingOptions, LexicalAutomergeDocument } from "../types";
export interface AutoMergePluginProps extends BindingOptions {
  handle: DocHandle<LexicalAutomergeDocument>;
  editor?: LexicalEditor;
}
export function AutoMergePlugin({ handle, editor: suppliedEditor, ...options }: AutoMergePluginProps): null {
  const [composerEditor] = useLexicalComposerContext();
  const editor = suppliedEditor ?? composerEditor;
  useEffect(() => {
    // @lexical/react can resolve its own compatible Lexical copy when a host
    // application has a hoisted dependency. The runtime API is identical.
    const binding = bindLexicalToAutomerge(editor as import("lexical").LexicalEditor, handle, options);
    return () => binding.dispose();
  }, [editor, handle, options.preserveInitialState, options.remoteUpdateTag]);
  return null;
}
export const AutomergePlugin = AutoMergePlugin;