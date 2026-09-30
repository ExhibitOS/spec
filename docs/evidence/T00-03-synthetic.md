# T00-03 synthetic asset evidence

Scope: spec contribution only, 2026-10-01. The parent task also requires platform
support matrix, scene and actual browser measurements; these are not claimed here.
Prerequisite: platform toolchain accepted before this implementation began.

Environment: macOS arm64, Node 24.21.0/npm 11.19.0 from the existing local nvm
runtime. No system runtime or paid service was changed. `npm ci --ignore-scripts`
uses the committed lockfile and `gltf-validator` 2.0.0-dev.3.10.

Commands: `npm run fixtures:generate`, `npm run check`, independent temporary
output generation with byte comparison, `git diff --check`.

Results: Khronos GLB validator: 0 errors and 0 warnings. Committed manifest size,
hash, rights and deterministic generator comparison passed. Four tests passed:
corrupt/truncated bytes rejected; 12 outward cube triangles, explicit normals,
1m bounds verified; PNG CRC, dimensions, zlib decoding and every pixel verified; reference scene
room, placements, rights and exact asset hashes linked and dangling/mutated
references rejected.
Temporary generation matched both committed binaries exactly.

Rights: original project synthetic shapes/colors; no third-party inputs. Fixture
assets and manifest have CC0-1.0 scope; programs/docs/config Apache-2.0. Original
license texts fetched from official sites. The granted project license discretion
was confirmed by the coordinating agent before applying this policy.

Recovery: regenerate binaries from the committed generator; use a prior fixture
commit/version for consumers if updating the generator changes their hashes.
This is not an OES release, device support claim or performance measurement.
