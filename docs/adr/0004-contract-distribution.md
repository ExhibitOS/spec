# Contract distribution draft

Status: implemented draft; package 0.1.0-draft.1, contracts 1.0.0-draft.1.
There is no stable release, registry publication, or previous stable migration.

We distribute an ESM npm tarball from the public Git source using exact
Node 24.21.0/npm 11.19.0. The package remains `private:true` to prevent accidental
registry publication; this does not prevent local tarball installation. Consumers
may vendor the immutable tarball with its SHA-256 and npm lock integrity, or use a
public release asset pinned by digest. No paid registry or private CI is required.
Production validator dependencies are exact public npm dependencies; install
requires registry access or a populated local npm cache. There are no lifecycle
install/build scripts, remote schema fetches, or private repository requirements.

The npm [pack documentation](https://docs.npmjs.com/cli/v11/commands/npm-pack/)
supports explicit destination, JSON inventory and disabled lifecycle scripts.
Our test establishes byte reproducibility with this pinned toolchain rather than
assuming that documentation guarantees cross-version packing.
[TypeScript module reference](https://www.typescriptlang.org/docs/handbook/modules/reference)
defines `exports` with `types` resolution. We test installed ESM NodeNext consumers
with exact TypeScript 6.0.3. Browser bundles, CommonJS and native Swift are not
provided by this Node package.

A small generator supports only the structural vocabulary present in these five
schemas; unsupported keywords or unresolved references stop the build. It resolves
local/public references without network, emits required/optional properties,
literal unions, objects, arrays and fixed tuples. JSON Schema
[combination rules](https://json-schema.org/understanding-json-schema/reference/combining)
are represented as union/intersection where structurally expressible. Required-only
license alternatives, numeric/string bounds, patterns, exclusive union semantics,
closed-object checks beyond TypeScript excess-property checking, rights/reference
semantics and binary integrity remain runtime checks. Types are not a proof of
validation. Every generated type records the exact source schema SHA-256; exported
schema copies retain their original bytes and IDs. `types:check` regenerates in
memory, rejects stale output, and compiles positive and `@ts-expect-error` consumers.

The artifact includes only public runtime code, declared schemas/examples,
synthetic fixtures, generated types, README and license files. Runtime ZIP CRC code
imports the public deterministic fixture generator; importing it performs no writes.
`artifact:check` inspects the pack inventory, packs twice, installs in a fresh
consumer outside the repository with install scripts disabled, runs API/CLI
conformance and compiles against installed type exports. Local reproducibility does
not constitute provenance signing or an SBOM/security audit.

## Artifact checker cache policy

`npm run artifact:check` performs the isolated consumer's first install against
`https://registry.npmjs.org` using a fresh temporary cache, then repeats `npm ci`
offline against the generated lockfile and populated cache. This is the CI default.
The source repository's `npm ci` caches tarballs but need not cache registry
packuments required to resolve dependencies in a new consumer's `npm install`.
Therefore a cold cache cannot be called an offline install environment.

`npm run artifact:check -- --offline` is an explicit opt-in for a caller's complete
prepopulated npm cache (both registry metadata and dependency tarballs). It performs
no registry request during consumer installation and fails if cache entries are
missing. Unknown/repeated arguments are rejected. Public source install itself
still requires registry access or an appropriately seeded cache; no private or
paid registry is required. Temporary online-check cache is removed with the
isolated consumer. The distributed README already documents the cache requirement;
its bytes remain unchanged so existing consumer artifact pins remain valid.
