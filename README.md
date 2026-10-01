# ExhibitOS spec

Public Open Exhibition contracts: OES artwork and exhibition documents, OEX
portable archives, OED deployment descriptors, and consumer conformance fixtures.

Current status: reproducible synthetic baseline fixtures and integrity checks are
available. OES Artwork, Exhibition and Lifecycle 1.0.0-draft.1 schemas and local validators
are available, along with OEX/OED1.0.0-draft.1 package/deployment validation.
Consumer conformance and draft package distribution are available. Stable release remains pending. Read [agent instructions](AGENTS.md) before editing and
[foundation research](docs/research/foundation.md) for the proposed approach.

This repository must be usable without access to private Capture implementations
or project operations. Only original synthetic assets may be used in its fixtures.

## Synthetic baseline

Read [fixture scope, hashes and reproduction commands](fixtures/synthetic/README.md).
Use Node 24.21.0/npm 11.19.0, run `npm ci --ignore-scripts`, then `npm run check`.
Code and documentation use Apache-2.0; listed original synthetic assets and their
manifest use CC0-1.0. See [licensing scope](LICENSE).

## Artwork draft

Read [OES Artwork rules and validator usage](oes/v1/README.md) and the
[version compatibility ADR](docs/adr/0001-artwork-contract-version.md).

## Exhibition and lifecycle draft

Read [spatial references, publication/freeze and validation scopes](oes/v1/exhibition.md)
and [lifecycle ADR](docs/adr/0002-exhibition-lifecycle.md).

## Portable package and deployment draft

Read [OEX layout, bounds and rights](oex/v1/README.md), [OED secret references](oed/v1/README.md)
and [package/deployment ADR](docs/adr/0003-package-deployment-profile.md).

## Public draft package

Package `@exhibitos/spec@0.1.0-draft.1` is an ESM Node package; wire contracts
remain `1.0.0-draft.1`. Use Node 24.21.0/npm 11.19.0. No stable release or
npm registry publication exists. Clone this public repository, run
`npm ci --ignore-scripts`, `npm run build`, `npm run check`, then
`npm run artifact:check`. The versioned tarball and SHA-256 are written to `dist/`.
Dependencies come from public npm; offline install needs a populated cache.

A consumer can vendor the tarball and checksum, verify SHA-256, then install it:

```sh
npm install --ignore-scripts --save-dev ./vendor/exhibitos-spec-0.1.0-draft.1.tgz
npm ci --ignore-scripts
npx --no-install exhibitos-conformance
```

Keep the consumer lockfile, tarball digest and source commit together. `private`
in the package prevents registry publishing; local tarball installation works.
Read the [distribution decision](docs/adr/0004-contract-distribution.md) and
[release/change checklist](docs/contract-release.md) in the public source.

```js
import { readFile } from 'node:fs/promises';
import { runConformance, fixtureURL, schemaURL, validateArtwork } from '@exhibitos/spec';
const result = await runConformance(); // {valid, cases: [{id,valid}], errors}
if (!result.valid) throw new Error('Contract conformance failed');
const artwork = JSON.parse(await readFile(fixtureURL('oes/v1/examples/sculpture.json')));
const checked = validateArtwork(artwork); // {valid, errors: [{code,path,message}]}
const schema = JSON.parse(await readFile(schemaURL('artwork')));
```

Root exports: `validateArtwork`, `validateArtworkFiles`, `validateExhibition`,
`validateExhibitionFiles`, `validateLifecycle`, `validateLifecycleFiles`,
`validateOex`, `validateOexManifest`, `validateOed`, `adaptOexManifest`,
`sealDraft`, `revisionHash`, `assetInventory`, version constants, `HASH_PROFILE`,
`runConformance`, `fixtureURL`, `schemaURL`. File APIs take an explicit asset root.
`validateOex` takes Buffer or Uint8Array bytes via a zero-copy bounded parser view. API callers must handle thrown I/O or
invalid API argument errors; normal document validation returns bounded errors.
Types `Artwork`, `Exhibition`, `Lifecycle`, `OexManifest`, `OedDeployment` describe
wire structure, while runtime validators enforce semantic/binary constraints.
Schema aliases `@exhibitos/spec/schemas/artwork.json` (and exhibition, lifecycle,
oex, oed) retain original identities; Node JSON import needs its import attribute.

Installed CLIs return one JSON result and exit 0 for accepted input, 1 for rejection:
`exhibitos-artwork document.json [asset-root [publication-UTC]]`,
`exhibitos-exhibition revision|draft|publication|freeze document.json` with existing
`--assets`, `--at`, `--revision`, `--publication` options, and
`exhibitos-package oex|oed file` or `identity-adapter manifest.json target-version`.
`exhibitos-conformance` accepts no arguments. Validation does not authorize
runtime publication, perform archive extraction or provision infrastructure.

`fixtureURL` accepts only these exact public fixture paths:

- `oes/v1/examples/{sculpture,painting,exhibition,draft,publication,freeze}.json`
- `oex/v1/examples/manifest.json`, `oex/v1/examples/synthetic.oex`
- `oed/v1/examples/{local,ssh}.json`
- `fixtures/synthetic/{sculpture.glb,painting.png,manifest.json,reference-scene.json}`

Braces above describe choices, not literal API inputs. Other paths are rejected.
The same 15 conformance cases check original GLB/PNG bytes, Exhibition,
publication/freeze, OEX and OED plus invalid version, scale, rights, dangling room,
leap second, corrupted archive and raw credential fields. This is Node consumer
conformance, not native iOS, image decoding, accessibility or browser evaluation.
Code, schemas and document metadata use Apache-2.0; the four files explicitly
listed in LICENSE use CC0-1.0. Both original license texts ship in the tarball.
