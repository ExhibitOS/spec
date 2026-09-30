# ADR 0001: Artwork draft identity and compatibility

Status: adopted for draft implementation, 2026-10-01.

Use JSON Schema2020-12 and OES Artwork `1.0.0-draft.1` at `oes/v1/`.
The immutable schema identity is
`https://exhibitos.github.io/spec/oes/v1/1.0.0-draft.1/artwork.schema.json`.
It is resolved from the cloned repository, without fetching that URI.
`schemaVersion` identifies the exact contract; the directory's v1 is a family,
not permission to accept any future version. Schema-only and semantic/file
validation jointly determine acceptance.

The validator rejects every unsupported version, including future minor/patch or
draft versions, with `UNSUPPORTED_VERSION`. Supporting a new version requires an
explicit pinned schema, adapter if meaning changes, migration fixture, positive
and negative regression corpus and documented consumer support interval.

There is no stable predecessor and therefore no truthful legacy migration to
provide now. Draft changes receive a new draft version/identity rather than
mutating a published identity. Before declaring 1.0.0 stable, complete exhibition,
OEX/OED and consumer conformance work and publish their acceptance evidence.
Stable backward-compatible additions need explicit consumer tests; required field,
unit/coordinate/permission semantics and reference changes require a major version.
Never silently coerce unknown data or drop extensions to make it pass.

Artifact revision is separate from schema version. Owning systems enforce immutable
revision ID, sequence and snapshot retention. Rights grants can be revoked outside
the snapshot; publication authorization must recheck current grant and tenant policy.

Choices added beyond the planning examples: UUIDs instead of free-form sample IDs,
exact UTC calendar validation, positive scale profile, reference and unit conversion
semantics, closed core with namespaced extensions, bounded local file checks. These
make the public contract independently testable without proprietary inputs.

Temporal profile: UTC timestamps use uppercase T/Z, seconds 00–59, and optional
one to three fractional digits. RFC3339 leap-second values and sub-millisecond
precision are intentionally rejected rather than passed from a permissive format
checker to JavaScript Date.parse. Every artifact timestamp must yield a finite
instant; publication input uses the same profile. Rights intervals are inclusive
at validFrom and exclusive at expiresAt, with millisecond-boundary regression tests.
This avoids rights checks silently failing open on NaN or precision truncation.
