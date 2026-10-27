# Selected floor resources — OEX 1.0.0-draft.5

This opt-in archive profile adds `floorResources` alongside the existing artwork,
media and optional space-still inventory. It packages only active, referenced
`org.exhibitos.studio/floors` version 1 pack selections. The binding content is
unchanged: an authored floor suppresses that room's stored implicit base.

Supported byte versions are WoodFloor051/1, Marble006/1, Tiles074/1 and Carpet004/1.
The public `floor-resources` module records the immutable paths, roles, exact
SHA-256, sizes, color treatment, CC0 source and modifications. Each selected pack
requires all its declared maps and its bounded UTF-8 notice. Carpet includes its
actual source AO; no AO is invented for the other packs. The normal role is
OpenGL, with the recorded 16→8-bit high-byte quantization. Repeat distances remain
authored settings or approximate whole patches, not measured physical claims.

Files use `resources/` plus their fixed artifact-relative path. They are neither
artworks nor WAV media and have no fabricated UUIDs. Readers reject unknown
versions/roles, duplicate or unsafe paths, mismatched selected inventory, extra
ZIP members, size/hash corruption and invalid bounded RGB8 PNG/UTF-8 data. No
runtime provider fetch is authorized by a source URL in the catalogue.

Exports without active floor packs retain their original profile choice (2, or
4 with an independent space still). Existing profiles 1, 2 and 4, their schemas,
fixtures and published package bytes remain unchanged. Older metadata-only floor
archives remain readable under their original profile; newly exported active
floor selections use profile 5. There is no implicit down-conversion or stripping
adapter. Frozen N1 package draft 5 / OEX profile 3 is a separate unpublished work
area and is not modified or adopted here.

This is source work until the affected package, rejection cases and real consumer
roundtrip pass. It does not establish shader, UV, native, mobile or human quality.
