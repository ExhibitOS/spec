# ExhibitOS spec

Public Open Exhibition contracts: OES artwork and exhibition documents, OEX
portable archives, OED deployment descriptors, and consumer conformance fixtures.

Current status: reproducible synthetic baseline fixtures and integrity checks are
available. OES/OEX/OED schemas and contract validators are not yet implemented
or released. Read [agent instructions](AGENTS.md) before editing and
[foundation research](docs/research/foundation.md) for the proposed approach.

This repository must be usable without access to private Capture implementations
or project operations. Only original synthetic assets may be used in its fixtures.

## Synthetic baseline

Read [fixture scope, hashes and reproduction commands](fixtures/synthetic/README.md).
Use Node 24.21.0/npm 11.19.0, run `npm ci --ignore-scripts`, then `npm run check`.
Code and documentation use Apache-2.0; listed original synthetic assets and their
manifest use CC0-1.0. See [licensing scope](LICENSE).
