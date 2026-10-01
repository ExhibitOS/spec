# ADR0002: Immutable exhibition pointers and bounded lifecycle validation

Status: adopted for draft implementation, 2026-10-01.

OES Exhibition and Lifecycle use independent immutable schema identities at
`https://exhibitos.github.io/spec/oes/v1/1.0.0-draft.1/exhibition.schema.json`
and `.../lifecycle.schema.json`. They reuse the pinned Artwork schema locally.
Every unsupported version is rejected; no stable predecessor or migration is claimed.
Existing Artwork identity/schema remains unchanged. Shared rights validation is
factored into a helper and the existing test corpus remains a compatibility gate.

Embed immutable Artwork snapshots so a portable exhibition can validate without
private Capture access or mutable API lookup. Placements reference snapshot and
asset IDs; repeated placement is valid. Stable artifact IDs and DB immutability
are separate from byte/document conformance. Rooms own coordinate spaces,
surfaces own rectangular openings and reciprocal doors form navigation graph edges.
Geometry physics/door world alignment/navmesh are future implementations.

Separate a mutable draft envelope, immutable candidate/revision, publication pointer
and freeze record. Do not accept a declared validation flag. Publication revalidates
revision structure, references and every recorded rights grant at its supplied time,
then binds IDs and computed content hash. Binary validation is an explicit additional
mode, and production publication still requires current grants/authorization.

Use the documented `oes-sorted-json-v1` profile rather than inventing a JCS claim.
Its bounded plain-JSON/Unicode/dense-array rules and deterministic object key order
are defined in the public contract and tested. Changed content requires a new
snapshot/hash; freeze additionally binds exact sorted assets, active publication,
OCI digest, DB migration and implemented OES versions. OEX/OED remain not-used
until a subsequent explicit schema revision integrates their versions.

Preserve the restricted UTC/millisecond profile to avoid leap-second NaN bypasses.
Accessibility fields are consumer requirements, not assessment evidence. Audio,
annotations and disabled declarative scripts are bounded extension points; absent
binary audio verification cannot pass full file-mode conformance. No runtime,
preservation reconstruction or unsupported device claim follows from these schemas.
