# Optional entrance space still

`org.exhibitos.viewer/space-still` version1 contains exactly `version` and one
`asset` with UUID, safe relative `.png` path, `image/png`, exact byte count,
SHA-256 and the existing closed Artwork rights object. The asset is at most
8MiB. Its identity and path cannot alias artwork/audio inventory or scene IDs.
The existing entrance extension must reference it with `imageAssetId` and a
nonempty image description. No source URL, credentials or hidden original are
embedded. Unrelated extension data is preserved.

This opt-in inventory leaves immutable OES Exhibition/Draft1 schemas and audio
references unchanged. A still cannot be used as an audio-zone asset. Missing
inventory preserves legacy documents. Unknown versions/fields, dangling
entrance references, invalid rights and asset aliases are rejected without
repairing or deleting source data.

An archive containing the namespace explicitly uses OEX `1.0.0-draft.4` and
`kind:"space-still"`. Its sole rights pointer is
`exhibition.json#/extensions/org.exhibitos.viewer~1space-still/asset/rights`;
provenance pointers are empty. Ordinary media packages remain profile2 and the
original profile1/2 fixture bytes are unchanged. Identity adapters never
silently upgrade or downgrade. The separately frozen furnishing profile3 is
outside this implementation line.

The archive binds bytes/hash/layout and active export permission. Its PNG
profile permits 8-bit RGB/RGBA, no interlace, at most2048 pixels per side and
2,097,152 pixels, at most256 chunks, and only IHDR, optional sRGB, contiguous
IDAT and IEND. CRC, bounded zlib expansion, stream completion and scanline
filter values are checked. Platform must still isolate actual decoding and
enforce current tenant/resource/source approval and display/export rights.
Directory-only validation does not claim this binary qualification; use a
complete profile4 OEX.

The pure `@exhibitos/spec/space-still` subpath exposes the same metadata
validator to Node/browser consumers without filesystem access or runtime
code generation. Its generated shape checker binds the new schema and the
unchanged Artwork rights schema. UTC/range/current display checks remain
explicit. Generated types do not replace runtime validation.

`synthetic-space-still.oex` uses an original tiny empty-room raster under CC0.
It proves the contract and binary path only. It is not an actual captured
interior, camera continuity, a renderer-quality comparison or device evidence.
Real entrance presentation and producer/consumer integration require their
own source-bound actual result.
