# OES Exhibition and lifecycle draft

Version **1.0.0-draft.1**. These schemas define portable documents and validation;
they do not implement Studio, Viewer, physics, navigation mesh, audio playback,
scripting execution or a production publication service. The fixture is original
synthetic data. All new schema/example/code/docs files use Apache-2.0; the existing
four CC0 fixture files remain unchanged.

## Independent validation

Use Node24.21.0/npm11.19.0 and `npm ci --ignore-scripts`, then:

```sh
npm run check
npm run validate:exhibition -- revision oes/v1/examples/exhibition.json --assets fixtures/synthetic --at 2026-10-01T01:00:00Z
npm run validate:exhibition -- draft oes/v1/examples/draft.json --assets fixtures/synthetic
npm run validate:exhibition -- publication oes/v1/examples/publication.json --revision oes/v1/examples/exhibition.json --assets fixtures/synthetic
npm run validate:exhibition -- freeze oes/v1/examples/freeze.json --revision oes/v1/examples/exhibition.json --publication oes/v1/examples/publication.json --assets fixtures/synthetic
```

Exit status and JSON result match the Artwork CLI. Explicitly empty `--assets`
values are rejected; only omitting the option selects document-only mode. Forbidden
options are rejected by their presence, including empty string values. Schema IDs are immutable
identities resolved locally; no network fetching or private repository is required.
The frozen example's zero runtime image digest and synthetic runtime version are
explicit placeholders illustrating binding fields, not evidence an OCI image exists
or that a frozen exhibition can currently be reconstructed.

Library entry points in `validators/exhibition.mjs`:
`validateExhibition`, `validateExhibitionFiles`, `validateLifecycle`,
`validateLifecycleFiles`, `sealDraft`, `revisionHash` and `assetInventory`.

Validation has distinct scopes:

| Scope | Established | Still required by a publication service |
| --- | --- | --- |
| Schema | Shape, supported exact version, bounded fields | References, rights and files |
| Document/semantic | References, normalized transforms, door graph, rights at supplied time, declared revision hash | Actual file integrity and current ownership/authorization |
| `--assets` | Document checks plus declared artwork file size/hash/signature and GLB conformance | Quarantine/isolated decoding, tenant authorization, current grant revocation, actual runtime |

An untrusted `validated` property is rejected and cannot serve as proof. The
publication validator revalidates the supplied revision and its rights, and compares
its computed hash every time. Production publish must also run file verification
and current authorization checks. `sealDraft` returns a deeply frozen independent
copy and explicitly says `validationScope: document-only`; it does not establish
binary integrity or durable database immutability.

## Coordinates and references

Room dimensions are width X, height Y and depth Z in meters. Room-local bounds are
X±width/2, Y0..height, Z±depth/2. Room transform maps local coordinates to exhibition
world space. Surface, placement, light and waypoint coordinates are local to their
owning room. Room/surface/light scale is identity; placement scale is positive.
All rotations use normalized XYZW quaternions, tolerance 1e-6.

Surfaces have a center transform and rectangular width/height in their own XY
plane, with normal +Z before rotation. Their center must be inside the owning room.
Doors/windows attach to a wall surface, using centered local XY offset and a
positive rectangular size that fits inside that surface. This is a coordinate and
graph contract; it does not prove surface polygons lie on boundaries, doors align
physically across transformed rooms, artwork volumes fit, or geometry is walkable.

A door has exactly one reciprocal door endpoint in a different room or
`exterior: true`. A window has neither graph endpoint nor exterior flag. Navigation
waypoints contain room-local positions. A room transition names the door in the
previous room via `viaOpeningId`; its reciprocal endpoint must belong to the next
room. Waypoints in one room omit this field. The validator checks graph consistency,
not collision-free paths or accessible physical widths.

Collections have unique UUID IDs, compared case-insensitively for references.
Artworks embed complete immutable Artwork snapshots indexed by revision ID.
Placements reference a snapshot and a display asset belonging to that snapshot.
The same artwork may have multiple placements, each with its own unique placement
ID/transform. Apply the artifact transform first, then placement, then room; recorded
source-unit conversion is already baked in and must not be applied again.

An asset ID or relative path reused across snapshots must retain exact path,
size, SHA-256 and MIME. Freeze uses a unique inventory sorted lexically by lowercased
asset ID. Total unique declared bytes are capped at 256MiB. File-mode verification
may inspect a shared artwork asset set once; its result does not substitute for
validating every snapshot's rights and metadata.

## Lighting and accessibility

Point/spot intensity uses candela, directional uses lux and area uses lumen.
Spot additionally requires beamAngle (0..π/2 exclusive at zero); area requires
positive rectangular dimensions. Other light types omit those parameters. Color
is linear RGB in [0,1]. A target placement, if present, belongs to the light's room.
This contract does not claim renderer photometric calibration.

Accessibility explicitly records list alternative, keyboard navigation, reduced
motion and stationary navigation requirements, plus accessible route references
and one plain-text description per placement. Dangling/duplicate references or
missing descriptions are rejected. These are declared requirements for future
consumers, not proof of browser accessibility compliance or user testing.

## Draft, revision, publication and freeze

- Draft envelope owns a mutable editVersion, creation/update times and a candidate
  revision; optional baseRevisionId preserves the fork source. Candidate validation
  can fail during editing/preview. `sealDraft` accepts only a valid candidate and
  creates an immutable copy. Storage owns revision UUID uniqueness and sequencing.
- Exhibition revision is an immutable artifact with stable exhibition ID, revision
  UUID and positive sequence. Editing published content creates a new draft/revision,
  rather than mutating the referenced snapshot.
- Publication contains exhibition/revision IDs, exact revision hash, publication
  time and published/unpublished status. Unpublished status requires a non-earlier
  unpublishedAt; published status forbids that field. Anonymous consumers read
  only approved immutable pointers. Current grants and tenant ownership must still
  be checked by the platform; document validation is not an authorization token.
- Freeze binds this active publication, revision hash, exact asset inventory,
  runtime image SHA-256 digest, runtime version, DB migration version and exact OES
  versions. OEX/OED are `not-used` in this draft because their contracts do not exist
  yet. These pins describe preservation inputs; backup/restore and reconstruction
  are separate tasks. A freeze cannot precede publication and needs valid display
  rights at its own instant.

All timestamps share the Artwork profile: calendar-valid UTC with uppercase T/Z,
seconds00–59 and optional1–3 fractional digits, plus finite instant parsing. Leap
seconds and sub-millisecond precision are rejected. Display grants include validFrom
and exclude expiresAt. Publication time is checked even for an empty exhibition.

## Hash and JSON profile

`oes-sorted-json-v1` recursively sorts object keys by JavaScript UTF-16 lexical
order, preserves dense array order, uses JSON.stringify for primitive encoding and
UTF-8 without whitespace/BOM, then SHA-256. Object key order and source whitespace
do not matter; content and array order do. This project profile is not a claim of
RFC8785/JCS conformance. Use `revisionHash`; hashing the source text is different.

Only finite numbers, well-formed Unicode strings, null/booleans, dense arrays with
no extra properties and plain objects with enumerable string-keyed data properties
are accepted. Cycles, accessors, symbols, sparse arrays and exotic prototypes are
rejected. Input is capped at1MiB, JSON depth32,100000 traversed nodes and16384 code
units per string; errors are capped100. Namespaced extensions preserve unknown
objects but are each capped16KiB, including embedded Artwork extensions. Core
objects reject unknown properties. Consumers must escape all text for display.

## Reserved audio, annotations and scripts

Audio assets use bounded local relative paths, exact hashes/size, explicit rights
and MIME declarations. Zones require a local room center/radius, volume[0,1],
plain-text transcript and autoplay=false. File-mode audio validation is explicitly
unsupported and returns a rejection rather than claiming byte verification.
Audio decoding/playback and consent UI are later tasks.

Annotations contain bounded plain text tied to a placement. Scripts are stored,
**disabled** declarations only: room-enter/exhibition-start triggers and typed
light-intensity/show-annotation/play-audio actions. Targets must resolve; delay is
0..60000ms, maximum32 actions/script and1024 actions/exhibition. No arbitrary JS,
HTML, external URL or network fetch is part of these core contracts. A future
execution contract must define permission, CPU/time, scheduling and cancellation
budgets before enabling scripts; unknown extensions cannot bypass these rules.
