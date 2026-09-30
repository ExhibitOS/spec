# Public contract foundation research

Status: research proposal, 2026-10-01. No OES/OEX/OED validator or stable release exists yet.
Implement schema work only after the synthetic baseline prerequisite is accepted.

## Standards checked

- [JSON Schema 2020-12 core](https://json-schema.org/draft/2020-12/json-schema-core)
  defines schema identifiers, references and dialect selection. Pin `$schema` and
  immutable `$id` values; distribute referenced schemas locally so conformance
  never depends on network resolution.
- [JSON Schema 2020-12 validation](https://json-schema.org/draft/2020-12/json-schema-validation)
  separates format annotation and assertion. UUID and UTC timestamp checks must
  explicitly assert formats in the chosen validator, with negative fixtures proving enforcement.
- [Khronos glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html)
  uses meters and a right-handed Y-up coordinate system. TRS rotation is a unit
  quaternion ordered XYZW. GLB has a 12-byte header and ordered JSON/BIN chunks,
  aligned to four bytes. JSON padding uses spaces and BIN padding uses zeros.
  Use the Khronos validator as a separate binary conformance check rather than
  assuming a correctly shaped artifact manifest establishes a valid GLB.

## Proposed baseline production

Produce an original geometric sculpture (a colored cuboid with explicit normals)
and an original flat color-grid painting. They must contain no copied artwork,
fonts, textures or names. Generate them using a committed deterministic program
without timestamps, random IDs or environment-dependent metadata. GLB serialization
should use fixed key ordering, little-endian binary packing and explicit padding.
PNG generation should use a fixed filter/compression strategy; record byte equality
against checked-in outputs, since valid encoders can produce different byte streams.

The generator, outputs and fixture metadata should live in spec. Platform may
copy a versioned public fixture package for its baseline; keep a source commit,
file hash and generator version so later schema work can reuse the same assets.
No dependency from spec back to a private planning repository is permitted.

Proposed assets and physical bounds:

| Asset | Geometry / pixels | Physical dimensions in meters | Transform |
| --- | --- | --- | --- |
| sculpture.glb | 12 triangles; explicit flat normals | width 1, height 1, depth 1 | baked meter geometry; identity node TRS |
| painting.png | 256 × 256 color grid | width 1, height 1; no inferred depth | dimensions belong to artwork metadata |

These are reproducibility fixtures, not representative production workloads. A
separate heavier scene can measure rendering costs without changing this minimal
contract fixture. Record measured browsers, GPU, OS, viewport, scene counts and
sampling conditions; proposed support and performance targets remain unverified.

## Hash, rights and provenance

Record SHA-256 as 64 lowercase hexadecimal digits plus exact byte count and MIME
for each binary output. Hash the source bytes before import, after staged copying
and after export. A different encoder output is a distinct asset even if it looks
the same. Hash lists must be checked against committed constants, not regenerated
and then immediately accepted without comparing them.

Use explicit synthetic authorship and a fixture-only redistribution grant selected
under the approved licensing policy. Include holder, license identifier, credit,
display/download/export/commercial permissions and provenance describing the
generator. Do not imply that the fixture license applies to third-party artworks.
Expiry should be absent for the synthetic grant; malformed or expired rights need
separate negative cases. Publication rights are evaluated at the publication time,
not solely by structural validation of a rights object.

## Proposed validation boundaries

1. Schema: types, required fields, positive dimensions/scales, SHA-256 syntax,
   supported version, explicit UUID/date checks, extension namespace.
2. Semantics: unique IDs, resolved room/artwork/asset references, normalized
   quaternion within documented tolerance, lifecycle transitions and rights.
3. Files: exact size/hash, MIME signature, bounded decoding, GLB validation.
4. Archives: normalized relative paths, duplicate entries, symlinks, traversal,
   size/count/compression limits, staging and atomic promotion.

Reject zero/negative scale in the OES baseline proposal even though glTF can
represent mirrored models. Keep any source-unit conversion in provenance and
bake it once before export. Never multiply declared meter dimensions by the
source-unit conversion a second time in a consumer.

## Consumer conformance plan

Offer one fixture corpus and machine-readable expected outcomes usable without
private repositories. Positive cases cover sculpture, painting and an exhibition
with repeated artwork placements. Negative mutations cover missing rights,
unsupported versions, malformed hash, corrupt bytes, zero dimension/scale,
non-unit quaternion, unresolved IDs, rights expiry and unsafe archives.

The future CLI should emit stable error codes with document pointers, exit nonzero
on rejection, avoid remote fetching and cap errors and input sizes. Consumers
may wrap it or use the schema package, but must prove matching corpus outcomes.
Generated types are convenience artifacts; they do not replace input validation.
Draft versions remain draft until release checks and consumer evidence pass.

Pending decisions: platform toolchain, validator dependency versions, final fixture
license, schema ID base, explicit limits and numerical tolerances. No dependency
installation or schema implementation is claimed by this research document.
