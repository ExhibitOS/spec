# ExhibitOS spec

Public Open Exhibition contracts: OES artwork and exhibition documents, OEX
portable archives, OED deployment descriptors, and consumer conformance fixtures.

Current status: reproducible synthetic baseline fixtures and integrity checks are
available. OES Artwork, Exhibition and Lifecycle 1.0.0-draft.1 schemas and local validators
are available; OEX/OED and stable contract release remain pending. Read [agent instructions](AGENTS.md) before editing and
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
