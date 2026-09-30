# OES Artwork v1 draft

Implemented version: **1.0.0-draft.1**, not a stable OES release. Artwork documents
are independent public artifacts. They require no Capture implementation, raw
capture files, private metadata, user identity or operations checkout.

The [JSON Schema](artwork.schema.json) uses draft 2020-12. Its `$id` is an identity,
not a promised hosted endpoint. This repository's validator loads it locally and
asserts UUID and calendar-valid UTC date-time formats. [Ajv documentation](https://ajv.js.org/json-schema.html)
describes the separate 2020-12 class; [format documentation](https://ajv.js.org/guide/formats.html)
describes the explicit formats plugin used here.

## Validate an artifact

Use Node24.21.0/npm11.19.0, `npm ci --ignore-scripts`, then:

```sh
npm run check
npm run validate:artwork -- oes/v1/examples/sculpture.json fixtures/synthetic
npm run validate:artwork -- oes/v1/examples/painting.json fixtures/synthetic 2026-10-01T00:00:00Z
```

The CLI returns `{valid,errors:[{code,path,message}]}` and exits 0 for acceptance,
1 for rejection. Omitting asset-root performs document validation only; providing
it additionally verifies files. The optional publication time explicitly checks
display rights at that UTC instant. There is no implicit current-time decision.

Programmatic consumers import `validateArtwork` or `validateArtworkFiles` from
`validators/artwork.mjs`. These are draft APIs, local to this repository; package
release and generated types are a later conformance task. Programs must not pass
unbounded untrusted objects: the CLI caps document bytes at 1MiB and error output
at 100 entries. Schema-only acceptance does not establish full conformance.

## Data rules

Core objects reject unknown fields. `extensions` is optional; keys use a reverse
DNS namespace and slash, such as `org.example/label`, and values are objects.
Consumers must retain unknown extensions but cannot base core correctness or
publication authorization on them. Metadata is plain text; displaying consumers
must escape it rather than inject HTML. No proprietary extension is required.

- `id` is the stable artwork UUID. `revisionId` identifies an immutable snapshot;
  `revision` is a positive monotonic sequence assigned by the owning system.
  `createdAt` belongs to that snapshot. A new snapshot must get a new revision ID.
  Schema validation cannot establish global uniqueness or immutability across a DB.
- Required metadata is title and artist text; artist identity is separate from any
  login account. Description, medium and language are optional. Required core
  fields and exact bounds are listed in the schema; no validator supplies defaults.
- Units are meters, coordinates right-handed Y-up, position XYZ in meters,
  rotation XYZW quaternion with norm tolerance 1e-6, scale a positive dimensionless
  XYZ vector. Zero/negative/mirrored scale is rejected by this draft OES profile.
- Dimensions are physical width/height and, for sculpture, depth in meters before
  the artifact transform. Optional weight is kilograms. Image dimensions are not
  derived from pixels. Consumers apply geometry transform once and do not resize
  models again from metadata dimensions; verify actual measured dimensions in import UI.
- GLB geometry is already in meters. An optional provenance scaleConversion records
  the original unit, exact multiplier and assets with conversion baked in. It is
  historical evidence, never a consumer instruction to multiply a second time.
- Primary asset must reference a declared model for sculpture or image for planar
  artwork. Preview images are optional. Asset IDs and paths are unique. Each asset
  declares exact SHA-256, byte count, role and MIME. Initial MIME support is GLB,
  PNG, JPEG (`.jpg`) and WebP. Extensions/suffixes are case-sensitive.
- Paths are bounded ASCII relative segments. Dot-segments, absolute paths,
  backslashes, URL/percent encoding and network fetch are unavailable. Maximum
  64 assets, 100MiB per asset and 256MiB total are reference validator limits.

## Rights and provenance

Artwork rights belong to the recorded holder, not the platform code's license.
Ownership is owner or authorized-licensee. At least license ID or license text is
required, together with explicit display/download/export/commercial flags and a
credit line. This is a claim recorded by the producer, not verification of legal title.

A structurally valid private import may retain display=false or expired rights.
Publication requires display=true and a grant active at the supplied publication
instant; expiry is exclusive. Platform must also enforce tenant ownership and
authorization and later rights revocation. Validator success does not authorize
publication by itself or promise DRM.

Provenance is ordered producer-supplied events with UUID, UTC time, type,
description and optional tool name/version and local source asset IDs. No device,
Capture method or processing secrets are required. Historic unavailable source
files can be described in plain text rather than unresolved asset references.
Authorship distinguishes human, AI assisted/generated and synthetic metadata.

## Binary checks and limits

File mode checks size/hash, MIME magic, regular files, paths and symlinks. GLB is
also passed to the pinned Khronos validator with external-resource loading denied.
Image signatures are checked; hostile image decoding is not implemented here.
Image/GLB parsing in a production ingestion service still requires quarantine,
process isolation, parser time/memory limits and TOCTOU-resistant staging. This
local conformance tool is not an upload gateway or sanitizer.

Examples reuse the existing CC0 binary fixtures. The new JSON examples/schema,
validator and documentation use Apache-2.0. Their sample rights records describe
the referenced original assets and do not change the JSON file license. The
[fixture license scope](../../LICENSE) remains limited to its four named files.
