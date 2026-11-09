# Changelog

## 1.0.0

- Require Lexical 0.53.0 or newer.
- Persist each block and the block order in place so concurrent edits to different blocks merge.
- Apply format, indent, text style, and child-structure changes during reconciliation.
- Share one block id between the document and presence. New ids are random, not index-based.
- Honor `remoteUpdateTag` on the binding and the React plugin.
- Make React, React DOM, and `@lexical/react` optional peers.
- Keep diff and reconciliation helpers off the package root.

## 0.1.0

- Initial public release with granular Automerge persistence, Lexical reconciliation, and ephemeral presence.
