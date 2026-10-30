# OEX portable package draft

Implemented **1.0.0-draft.1**: bounded archive validation and a deterministic
original synthetic package. This is not a stable release, database import,
filesystem extraction, ID-remap transaction or reconstruction implementation.

```sh
npm ci --ignore-scripts
npm run check
npm run validate:package -- oex oex/v1/examples/synthetic.oex
npm run validate:package -- identity-adapter oex/v1/examples/manifest.json 1.0.0-draft.1
```

Use Node24.21.0/npm11.19.0. Results are bounded `{valid,errors}` JSON, exit0/1.
The library entry points are `validateOex`, `validateOexManifest`,
`packageAssetManifest`, `validateExportRights` and `adaptOexManifest` in
`validators/package.mjs`, plus `readBoundedZip` in `validators/zip.mjs`.
They do not fetch URLs, resolve credentials or write/extract files.

## Layout and manifest

Only these declared regular files are allowed, with manifest first:

```text
manifest.json
exhibition.json
assets/<artifact-relative-path>
```

Exhibition embeds immutable Artwork snapshots. Manifest binds the exact Exhibition
file bytes/SHA-256 and its separately computed `oes-sorted-json-v1` revision hash,
exhibition/revision UUIDs, exact supported OES versions, creation UTC and generator
name/version. Each unique asset binds ID, MIME, bytes, SHA-256, package path,
artifact-relative path and exact rights/provenance JSON pointers into Exhibition.
Inventory is sorted by lowercased asset ID; JSON object key order is insignificant.
One package path has one asset ID; aliases using distinct IDs for one file are not
supported by this draft package profile. Shared placements/snapshots can reuse
one identical asset ID and retain every applicable rights/provenance pointer.

Separate credential files, `.env`, raw Capture datasets and undeclared records are
excluded by the closed layout. This does not detect every secret or private datum
hidden in arbitrary text or artwork bytes; the exporting service still reviews
and authorizes metadata/assets. No proprietary Capture fields are required.

## ZIP subset and actual limits

The reader implements a deliberately narrow classic single-disk ZIP subset:
STORE and DEFLATE, regular files, bounded ASCII relative paths and flags0/UTF-8.
No ZIP64, encryption, data descriptors, extra fields, comments, directory records,
self-extracting prefix, special files or trailing records are supported. Many valid
third-party ZIP variants are therefore rejected. The original writer uses STORE
for deterministic cross-runtime bytes; this is not a general ZIP compatibility claim.

| Limit | Enforced before or during decoding |
| --- | --- |
| Archive bytes | 64MiB |
| File count | 256 |
| One expanded file | 100MiB |
| Total declared expanded bytes | 256MiB |
| Expanded/compressed ratio | At most100 per entry |
| JSON document bytes | 1MiB, fatal UTF-8 decoding |
| File-name length | 240 ASCII bytes |

Central and local headers must agree on names, flags, compression method,
version needed, timestamps, CRC and sizes. Local file ranges are contiguous in
central order from byte0, with no overlap/gap/orphan record. CRC is verified on
actual expanded bytes. DEFLATE decoding has a maximum output equal to the bounded
declared size, requires exactly that size and rejects unused compressed tails.
Count/size/ratio checks happen before decompression. SHA-256/byte count, MIME
signatures and Khronos GLB validation are separate subsequent checks.

Path traversal, absolute/drive paths, backslashes, percent encoding, case-folded
duplicates, Windows reserved names/trailing dots, symlinks and file/directory prefix
collisions in either order are rejected. Ordinary nested sibling files are allowed.
The reader stays in memory; it never extracts into a project or user-data directory.
Production ingestion still needs quarantine, isolated parsing and external worker
CPU/memory/time budgets. Image signatures are verified; image content decoding and
media/audio packaging are not implemented by this profile.

The format reference is [PKWARE APPNOTE6.3.10](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT).
Only the supported public ZIP records/methods are used; the specification text is
not redistributed. Bounded raw inflation uses the existing runtime's documented
[maxOutputLength/info options](https://github.com/nodejs/node/blob/v24.21.0/doc/api/zlib.md).
No new ZIP npm dependency or copied proprietary implementation was introduced.

## Rights and time

Export requires explicit `rights.permissions.export=true` on every embedded
snapshot and a recorded grant active at manifest.createdAt. It does **not** require
display permission: display=false/export=true preservation packages are accepted.
Display/publication authorization is a different policy. Grant start is inclusive,
expiry exclusive; all time values use the existing restricted UTC/millisecond
profile and finite parsing.

Package creation/export time cannot precede the Exhibition or any Artwork snapshot
creation time. This catches contradictory backdated declarations; it does not
prove timestamps authentic or validate rights at a future importing/viewing time.
Current ownership, current grant revocation, export authorization and importing-time
policy remain service responsibilities. Validation is not an authorization token.

## Collision and import-session contract

A future importer stages all validated files before committing DB/object state.
Keep the original archive and revision hash immutable. Build one import-session
mapping from each colliding typed original UUID to a fresh destination UUID and
apply it consistently to Exhibition, revision, room, surface, opening endpoints,
placement, Artwork snapshot, asset, lighting, navigation, accessibility, media,
annotation and script references. Byte hashes are never remapped. Object-storage
keys are separate from artifact-relative paths.

Exact trusted content may be reused under the destination's rights/tenant policy;
otherwise fork new IDs/revision IDs and preserve original IDs/source hashes in
import-session audit/provenance. Recompute the newly derived revision hash after
remapping; never describe it as byte-identical to the source. Partial failure rolls
back staging and transaction, not the source artifact. These are requirements for
the later importer; this task performs no ID generation or DB transaction.

## Compatibility and original fixture

Only the exact declared draft versions are supported. The current adapter is an
identity clone after validation, named `identity-only-no-migration`. The executable
[compatibility cases](../../fixtures/compatibility/oex-adapter-cases.json) prove
unsupported source/target versions reject. There is no previous stable version,
legacy support period or data migration implementation to claim. Future adapters
must pin both schemas, preserve source identity, provide actual before/after fixtures
and be assigned to spec with consumer adoption coordinated separately.

`synthetic.oex`: 231038 bytes, SHA-256
`747c11f09ec64a656466bbf14453a304b550afcf4c88daba845d3e1c6b45c72f`.
Reproduce with `npm run fixtures:package`; tests compare generated bytes against
this committed constant. Its new package-only Exhibition revision2 includes bounded
Apache/CC0 legal-text extensions; the previously published OES examples/schemas
are unchanged. Original GLB/PNG bytes remain exactly the baseline CC0 assets.
Generated metadata/docs/code use Apache-2.0. The ZIP contains those legal terms
for standalone distribution and no real artwork, private Capture or credential.

## Optional selected surface materials

Profile `1.0.0-draft.7` adds `materialResources` for the two version1 user-authored
CC0 packs `museum-matte-paint` and `fine-lime-plaster`. Only packs selected on an
existing wall or ceiling through `org.exhibitos.studio/materials.surfaceTextures`
are included. Their exact RGB8 color, roughness and NormalGL files and distribution
notices use compiled descriptors; no caller URL, original authoring file, preview,
height or invented AO map is packaged. Base color is sRGB; roughness and normals
are noncolor. Each map is exactly 2048² and at most8MiB. This separate map profile
does not raise the cover-still pixel limit or claim GPU/mobile fitness.

The existing materials namespace keeps version1, its scalar `surfaces` map and
the combined16KiB/64-surface limit. Texture entries contain only a known `pack`
(`id`, `version`), `repeatMeters` (two0.05..20m values), `rotation` (±π), and
`normalScale` (0..2). Archive identity and exact bytes bind all selected resources;
floor maps, furnishings, media and space stills remain composable. Existing
profiles1/2/4/5/6 and ordinary exports are unchanged. No cross-profile downgrade
adapter or automatic migration is provided.

## Explicit file-backed consumer profile

`bounded-file-v1` is an opt-in Node consumer validation profile; it uses the distinct OEX `1.0.0-draft.9` manifest identity and does not
change earlier identities or the deterministic STORE ZIP layout. `withOexFile` validates a caller-owned private, stable snapshot and
then invokes a preparation callback. A callback may stage data privately, but
must not publish or commit it before the function returns successfully. The
caller must discard staging on failure, and keep the snapshot and its parent
private for the entire operation. The file descriptor is checked for change;
this is not a substitute for isolation from a writer with access to the file.
Entry reads must be sequential, and callers must not retain every returned entry.

This profile caps archive and expanded totals at 512MiB, individual entries at
32MiB, entry count at 256 and expanded/compressed ratio at 100. The Exhibition
semantic validator admits an explicitly requested profile with at most 512MiB
of unique assets, retaining each Artwork's existing total limit. Default OES
validation and old in-memory OEX APIs keep their original limits. Existing
readers reject archives above their own size limits; implementations must not
silently truncate, reinterpret or upgrade an old offline freeze. A compliant
file can still be rejected by an older consumer and requires explicit negotiated
consumer support. This profile is not a resource guarantee for arbitrary hosts;
workers and consumers must bound concurrency, memory, disk and execution time.

`writeOexFile` creates a new file in a private caller-owned directory, never
replaces an existing destination, and validates the exact created file before
returning. Its source callback supplies one exact asset at a time; callers retain
authorization, current rights, source integrity, staging cleanup and transactional
commit responsibilities. This profile does not enable larger Platform, Manager,
static-host, or signed-freeze workflows by itself.

The file profile's 32MiB entry limit is intentionally stricter than the legacy
ZIP reader's 100MiB expanded-entry limit. Continue using the legacy reader for
legacy non-opt-in packages; switching all old imports to the new reader would
reject some archives previously accepted by the contract.
