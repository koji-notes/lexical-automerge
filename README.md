# @koji/lexical-automerge

Synchronize a [Lexical](https://lexical.dev) editor through an
[Automerge Repo](https://automerge.org). The binding stores Lexical's portable
serialized editor state and applies remote changes without update feedback
loops.

```ts
import { Repo } from "@automerge/automerge-repo";
import { createEditor } from "lexical";
import { bindLexicalToAutomerge } from "@koji/lexical-automerge";

const editor = createEditor({namespace: "notes", onError: console.error});
const handle = repo.create({
  editorState: editor.getEditorState().toJSON(),
  revision: 1
});
const binding = bindLexicalToAutomerge(editor, handle);
// binding.dispose() when the editor is unmounted
```

For React, add `<AutoMergePlugin handle={handle} />` inside a
`LexicalComposer` (also exported from `src/react/AutomergePlugin`). Incoming
states are reconciled in place with the `automerge-sync` update tag; the
binding never calls `setEditorState` or clears the root. `AutomergeBlockNode`
is optional and provides a stable application-level `blockId` distinct from
Lexical's transient node key. Presence is ephemeral and uses
`PEER_PRESENCE_COMMAND`, so cursor state is never persisted.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The package publishes both ESM and CommonJS builds and requires Node 18 or newer.
