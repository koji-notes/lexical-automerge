# @koji-api/lexical-automerge

[![npm version](https://img.shields.io/npm/v/@koji-api/lexical-automerge.svg)](https://www.npmjs.com/package/@koji-api/lexical-automerge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Synchronize a [Lexical](https://lexical.dev) editor through an
[Automerge Repo](https://automerge.org). The binding stores schema version 2:
an ordered list of block ids and one Automerge record per block. Remote
changes are reconciled in place, so an edit to one block merges with an edit
to another.

Requires `lexical` `>=0.53.0`. React and `@lexical/react` are optional peers
used by the React entry.

```ts
import { Repo } from "@automerge/automerge-repo";
import { createEditor } from "lexical";
import { bindLexicalToAutomerge, createLexicalAutomergeDocument } from "@koji-api/lexical-automerge";

const editor = createEditor({ namespace: "notes", onError: console.error });
const repo = new Repo({ isEphemeral: true });
const handle = repo.create(createLexicalAutomergeDocument(editor.getEditorState().toJSON()));
const binding = bindLexicalToAutomerge(editor, handle);
// binding.dispose() when the editor is unmounted
```

For React, add `<AutoMergePlugin handle={handle} />` inside a
`LexicalComposer`. Incoming states are reconciled in place with the
`automerge-sync` update tag (`remoteUpdateTag` overrides it). The binding
never calls `setEditorState` or clears the root. `AutomergeBlockNode` is
optional and provides a stable application-level `blockId` distinct from
Lexical's transient node key. Presence is ephemeral, imported from
`@koji-api/lexical-automerge/presence`, and uses `PEER_PRESENCE_COMMAND`, so
cursor state is never persisted.

## Development

```sh
npm ci
npm run typecheck
npm test
npm run build
```

The package publishes both ESM and CommonJS builds and requires Node 18 or newer.
