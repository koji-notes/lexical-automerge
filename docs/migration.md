# Persistence migration

Documents written by earlier versions containing `editorState` are migrated
when loaded. New documents use schema version 2 with an ordered block ID list
and independently mergeable block records containing text, attributes, and
the registered Lexical node JSON. Invalid documents are rejected rather than
being applied to an editor.

1.0 keeps schema version 2. Block ids assigned to nodes that do not already
have one are random ids, not `block-${index}`. Local writes update each block
record and splice `order` instead of replacing the document. Legacy
`editorState` documents are still accepted by `migrateDocument` and by the
binding.
