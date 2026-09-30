# Synthetic baseline v1

These original fixtures contain no real artwork, raw Capture data, personal data,
third-party geometry, textures or fonts. They are reusable baseline inputs, not
OES documents. Public OES contracts remain unimplemented.

| File | Content | Size | SHA-256 |
| --- | --- | --- | --- |
| sculpture.glb | 1m cube, ground anchored; 24 vertices, 12 outward triangles, explicit normals | 1516 bytes | `1e4e53565fdbc5a71b1aaa83d6b25df6e8025add2f08b35fdca20475fbbca460` |
| painting.png | 256 × 256 RGB color grid with sRGB declaration; 1m square display dimensions | 196960 bytes | `33035fadc694f8a64d89d07425a2ed0babb9352208cf34aab657ed5922a55fe9` |

The sculptural geometry is baked in meters, right-handed Y-up with identity TRS.
The image has no intrinsic physical scale; its 1m dimensions come from the fixture
manifest. Never infer physical dimensions from pixel resolution.

## Reproduce and check

Use Node 24.21.0 and npm 11.19.0, matching the adopted platform toolchain:

```sh
npm ci --ignore-scripts
npm run fixtures:generate
npm run check
```

The generator also accepts an output directory: `node scripts/generate-fixtures.mjs /tmp/synthetic`.
It writes binaries only, never expected hashes. `fixtures:check` compares committed
bytes, hashes, sizes, permissions and generator output, then runs the exact pinned
Khronos validator. Tests prove rejected corruption and validate cube geometry and
PNG pixel/checksum content. PNG uses explicit uncompressed zlib blocks to preserve
bytes across compression library versions; its size is deliberate.

Changing generator output requires an explicit fixture version, updated hash review
and consumer baseline update. Neither these tiny assets nor validator results
establish device support, rendering performance, or production workload readiness.

## Rights and license scope

ExhibitOS contributors associate CC0-1.0 with `sculpture.glb`, `painting.png` and
`manifest.json`, to the extent copyright and related rights apply. Original
synthetic inputs were created for this project under delegated license authority.
Display, reproduction, modification, redistribution, download, export and commercial
use are permitted under this dedication. Credit is optional, there is no expiry,
and this fixture-only dedication does not apply to other artwork or code.

The [unaltered CC0 legal text](../../LICENSES/CC0-1.0.txt) and
[official canonical dedication](https://creativecommons.org/publicdomain/zero/1.0/)
are the terms. CC0 includes a public-license fallback and excludes trademark and
patent rights. The manifest is a convenience representation, not replacement terms.
Generator, checks and documentation use [Apache-2.0](../../LICENSES/Apache-2.0.txt).

Copy this README, manifest and CC0 legal text with any distributed fixture package.
Consumers must preserve recorded hashes and source commit in performance evidence.
