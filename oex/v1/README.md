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

`withOexFileHandle` performs the same validation using an already-open caller-owned
Node FileHandle, without reopening its path; it never closes that handle. The caller
must open it safely, bind its identity and digest to the operation, and close it
afterward. This does not establish worker drain or prevent writes to the inode.

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

The offline package includes `policies/oex-capacity-v1.json` and exports the
validated immutable policy as `@exhibitos/spec/oex-capacity-policy`. Its byte
and count fields distinguish ZIP archive, expanded data, individual entry,
exhibition asset total, native upload chunk and packed resource inventory;
these limits do not authorize disk reservation or change hosting, rendering,
timeout, existing in-memory or individual Artwork policies. Native consumers
may pin the exact packaged JSON bytes and generate build-time constants. A
missing, malformed, unknown-version or internally inconsistent policy must
fail the build or validation; runtime client input must not override it.

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


## Optional registered material catalogue

Draft.10 is selected only when the exhibition uses a newly registered floor or
wall material identity outside the legacy catalogue. An inactive room-base
floor binding keeps its identity without carrying unused maps. The archive uses the same
exact `floorResources` and `materialResources` roles and notice descriptors.
Pack IDs and versions must resolve to exact immutable registry entries. New
map files use the bounded metadata-free square RGB8 material profile. Their
dimensions and hashes must match the registered bytes. Unknown packs fail
explicit validation. Labels and preview thumbnails are catalogue display
metadata outside the archive and its saved surface bindings.

In-memory archives retain the ordinary ZIP limits. The existing bounded-file
writer marks this profile with `archiveProfile: "bounded-file-v1"`; that form
requires the bounded file consumer and uses the existing capacity policy.
Prior schemas and default archive versions stay unchanged for legacy packs.

Quiet Oak Herringbone version 1 registers user-authored CC0 color, OpenGL +Y
normal and roughness maps with an exact portable notice. The catalogue presents
a 0.9 m repeat. These descriptors establish byte identity and portability.
Visual selection and device qualification remain consumer evidence.

Fine Gallery Concrete version 1 adds a user-authored CC0 wall material with
three exact 2048 RGB8 maps, OpenGL +Y normal, a portable notice, a 256px
thumbnail and a 2 m catalogue repeat. Selected concrete uses draft.10; its
material inventory admits all three wall packs (12 map/notice resources).
Legacy draft.7–9 schemas and their two-pack limits are unchanged. The thumbnail
is catalogue metadata and is not required to import or display an OEX. No
separate concrete floor, height, AO or room/device qualification is implied.

### Workspace material profile candidate (draft.12)

A snapshot with the `org.exhibitos.studio/workspace-materials` extension uses
an explicit draft.12 manifest. Its workspace-material resource list is derived
from referenced immutable material IDs, versions, roles, hashes and lengths;
caller-supplied paths are not authority. Only exact referenced bounded PNG maps
are included. The reader verifies map bytes, dimensions, role color-space rules,
rights declarations and provenance shape, and rejects absent or extraneous entries.
It does not independently verify the truth of the supplied provenance. Every material
must have an export grant valid at the archive creation time. Built-in resources
needed for a retained fallback stay in the existing resource lists.

The profile is under implementation and is not admitted by earlier readers or
current native runtime payloads. Newly written code refuses to label a snapshot
with workspace materials as an older profile; already deployed older software
cannot be retroactively changed and may not understand the extension. Importers
must validate the complete archive and bind/remap material identities to the
destination owner before exposing an editable workspace. This profile is not
proof of service-side registration, a valid current display grant, or visual
quality of the material.

### Workspace furnishing profile candidate (draft.13)

An exhibition using `org.exhibitos.studio/workspace-furnishings` uses the
explicit draft.13 manifest. Its inventory carries only the GLBs referenced by
that exhibition, with a canonical path derived from each immutable furnishing
ID, version and SHA-256. A workspace material inventory may coexist. Exact
bytes, archive layout, a valid GLB without external resources, export rights
at package creation, room-local references and unique identities are checked.
Names and provenance must be trimmed and have at most 120 and 1024 UTF-16 code
units respectively; the semantic validator enforces these limits in addition
to the schema's Unicode code point limits.
This is a visual placement record; it does not assert support, collision,
seating, physical dimensions or any other function of the mesh.

No cross-profile migration is defined. Readers must reject relabelled older
profiles, and importers must revalidate the model and current rights, and bind
or remap the furnishing identity to the destination owner before allowing edits.
This profile does not establish ownership, registration or current permission.
Unused workspace library entries belong in the workspace backup, not an
individual exhibition package. Existing profiles and fixtures remain unchanged.

### Workspace furnishing visual profile v2 (draft.14)

Workspace furnishing extension version 2 adds an explicit `stool` kind to the existing `pedestal` and `bench` kinds. Descriptor identity and room-local placement remain visual-only; no seating or collision semantics are implied. Version 2 requires OEX draft.14, including the same exact resource inventory and rights validation as draft.13. Version 1 continues to require draft.13. Cross-profile relabelling and unsupported extension versions are rejected.

### Workspace furnishing room-visual profile v3 (draft.15)

Version 3 retains the v1/v2 visual kinds and adds `partition`, `info-stand`, `barrier`, and `display-case`. It retains descriptor version 1, room-local poses, rights and exact model inventory and requires OEX draft.15. Earlier profile versions remain unchanged; collision, room division, artwork or text attachment and interactive mechanisms are not implied.

### Workspace artwork-frame candidate

OEX `1.0.0-draft.16` carries workspace-furnishing extension version 4. Frame
attachments pin a placement, artwork revision and image asset together with the
registered furnishing ID, version and model SHA-256. They are not room-local
visual placements. Older extension and OEX versions cannot represent this row;
unsupported versions are rejected rather than silently downgraded. The OEX
workspace furnishing resource inventory includes the exact frame model and its
rights alongside any other workspace furnishing resources.

The initial supported source is the fixed thin-brass GLB, SHA-256
`4b14e45ccf14ed38eea90c50553733a0b97b1671b9ec377d900e5a947545f8b4`,
7,892 bytes. It has a nominal 0.6 × 0.8 m opening, wall-side anchor at model
Z=0, front direction −Z, a reference image plane at Z=−0.012 m, and 0.025 m
frame depth. A frame is bound only to an image of those metre dimensions within
1 micrometre numeric tolerance, with no declared artwork depth and unit artwork,
placement and room scale. A procedural frame on the same placement is rejected.
The mesh and image are neither resized nor cropped. This contract describes
visual alignment only; it does not establish physical support, full-edge
clearance or compatibility with any other frame asset. Descriptor validation
is not proof of ownership, current rights, model bytes or approval; consuming
applications must independently enforce those conditions.

### Fixed ordinary artwork-frame models (draft.17)

OEX `1.0.0-draft.17` carries workspace-furnishing extension version 5 with
unchanged descriptor and attachment fields. Version 4 and draft.16 retain their
thin-brass-only semantics. Version 5 uses the version 1 fixed visual model
records exported by `@exhibitos/spec/artwork-frame-models`; each record binds an
exact SHA-256 and byte count to metre units, a 0.6 × 0.8 opening, wall-side
anchor Z=0, front −Z, model depth, and a model-specific image-front Z. The
records cover thin brass, gallery, black aluminum, brushed silver, classical
gilt, dark baroque, natural oak, neutral linen liner, walnut stepped and white
gallery box. Package draft.25 additionally recognizes the exact black-float
frame GLB (SHA-256
`d4bdc4201fe2e8866652350915799a346ba07cf73078fec9f7f6e275287e918a`,
152,056 bytes) with image-front Z=−0.037 m and depth 0.045 m. Earlier package
versions do not recognize this record. Record dimensions and offsets
are authoritative fixed data, not client-provided geometry or proof of bytes.

Frame targets, numeric tolerance, absent image depth, unit transforms, rights,
GLB byte verification and no-crop/no-resize requirements remain as in v4.
Consumers resolve the record from the validated SHA and byte count, align its
image plane with the image, and retain exact model bytes in inventory. Legacy
profiles must not be relabelled; consumers without v5 reject it. The profile
only describes visual alignment, not physical support, backing, corner
clearance, wall contact, manufacturing fit or absence of z-fighting.

The fixed model record version 2 for black aluminum, brushed silver and natural
oak identifies a separate original-derived GLB produced by the
`omit-unused-invalid-tangent-r1` recipe. Each binds the source v1 SHA and size
and retains its visual geometry values. Earlier records remain unchanged.
Readers lacking these exact v2 records reject them; the record does not prove
current rights or authorize use. The OEX/extension wire versions are unchanged.

Package draft.27 adds the exact Wheat matte-oak ring (SHA-256
`a96b4942c2cd10b25fe1b33001443e1824fc125bc258f28a68547d38d8c54362`,
3,380 bytes). On a unit-scale image with no depth, the consumer translates its
four corner profiles to fit widths from 0.800 to 1.000 m and heights from 0.600
to 0.800 m, leaving 0.003 m of clearance per edge. The artwork transform and
frame cross section stay fixed. The original GLB is retained in the inventory
and fit is derived from the saved image dimensions. Existing model records
retain their original dimensions and behavior.

### Fixed opening visual attachment (draft.18)

OEX `1.0.0-draft.18` carries workspace-furnishings extension version 6. It
retains the version 5 inventory, visual placements and frame attachments and
adds a nonempty `openingAttachments` array of closed
`{openingId,furnishingId,furnishingVersion,modelSha256}` records. A door may
have at most one attachment; every portal descriptor must be used. The legacy
`portal-finish` model is the exact 164,044-byte GLB with SHA-256
`385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b`.

The host is an existing wall door with a 2.4 × 2.6 metre opening, floor-aligned
in its room, and level unit-scale room and wall transforms. Dimension and
floor alignment comparisons use a 0.000001 metre numeric tolerance. An explicit
architectural wall finish must have depth 0.2 metres; absence does not assert
physical wall thickness. The model anchor is the opening's bottom centre in
wall-local XY, at wall-local Z=0, with +Y up and −Z front. The visual has no
independent position, orientation or scale; deleting or changing its host to
an incompatible door requires an explicit detach before saving. Moving the
same opening ID, including to another compatible wall, carries its attachment
with it; all host conditions are rechecked on the new wall. The visual
does not alter the authoritative opening, collision or navigation.

Package draft.27 also admits the exact pale-mineral portal (SHA-256
`62fd3bc49e0e77ffde26f60dee7ddfbbac0939347d68ea53a94700de0695f1ae`,
2,468 bytes). It requires reciprocal, opposing 2.4 × 3.0 m doors aligned at
floor level, with the mate 0.020 m behind the host. The host has a plain
0.120 m wall extrusion and the mate has a 0.120 m extrusion with an edge
finish. The floor-centred model spans host-local Z=−0.082 to +0.060 m.
The same single-opening attachment and native opening geometry are retained.

Detach of the final portal removes its unused descriptor and selects the
lowest existing furnishing extension version that can represent remaining
content; with no furnishings, the extension is removed. Version 6 without
an opening attachment is invalid. Older readers reject draft.18 rather than
silently dropping the portal. Rights and exact source bytes are checked by the
consumer. This is a visual alignment contract, not a claim of physical trim
fit, construction clearance, lighting, automatic resizing or any door motion.
