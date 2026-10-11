# Optional auth and Capture producer contracts

Status: public draft `1.0.0-draft.1`. This additive opt-in package subpath does not change OES/OED versions, introduce a plugin registry, install a provider or expand cloud/device support. Existing simple installs use their current providers unchanged.

## Authentication boundary

An `AuthProvider` declares `session-observation-v1` and implements `resolveSession(context, {signal})`. The context is opaque and **owned by the server**, such as its already authenticated request. The result is `null` or the existing Platform session projection: `id`, `userId`, `tenantId`, `role` (`admin`, `artist`, `curator`, `viewer`) and UTC `expiresAt`. Cookie, CSRF token, password, key and bearer token are never serialized into descriptors or observations.

`observeAuthSession` rejects expired, wrong-tenant, malformed or unsupported results and cancellation. It cannot establish that a resolver actually authenticated a user. Only a configured trusted server adapter may provide observations. Do not accept an adapter or session JSON from an HTTP caller. Each resource access still requires existing server membership, artwork/exhibition access and current rights checks; roles and historical observations are not grants. The adapter must reobserve its own actual session/expiry on each call, use existing CSRF validation for writes, and propagate logout/revocation. `localSessionAdapter` is a runnable projection wrapper for an existing server session service, not an alternative login service. Provider errors are bounded generic codes and do not expose thrown credentials.

## Capture boundary

A `CaptureProducer` declares `oes-artwork-v1` and implements `produceArtwork(context, {signal})` returning `{document, assetRoot}`. It returns an ordinary public OES Artwork and a consumer-owned asset directory. `inspectCaptureProducer` uses the same existing `validateArtwork`/`validateArtworkFiles` for every producer, including actual GLB/image binary checks, bytes, SHA, scale, provenance and rights. It snapshots metadata; it never guesses colour, converts raw sensor data, replaces IDs/rights or invents artist approval. Pass the actual publication time when checking time-scoped display rights. Import/publication must separately check current authenticated permissions. No private Capture schema, code, original dataset or operations dependency is required.

The consumer controls filesystem access and must admit the adapter's root; the validator's safe asset paths are not a sandbox for arbitrary caller-chosen roots. A successful observation is point-in-time, not a future authorization or physical quality certificate. Revalidate before import/publish/export and retain exact input hashes. Unsupported provider versions or contracts refuse before calling the adapter; the host may keep its existing local/auth provider or ordinary external OES import explicitly, never silently relabel unsupported output.

## Public examples and checks

[Closed descriptor schema](descriptor.schema.json) and descriptors for [local session](examples/local-session.json), [file producer](examples/file-artwork.json), [memory producer](examples/memory-artwork.json) are independent capabilities. Code/descriptors use Apache-2.0; the existing original synthetic artwork assets remain CC0-1.0. `../examples.mjs` contains two independent actual producer paths (file read and in-memory document), both handing off the **same** original synthetic OES/GLB asset through the public validator without changing its bytes or metadata.

```js
import { inspectCaptureProducer } from '@exhibitos/spec/providers';
// A trusted, explicitly configured producer supplies the existing public OES package.
const result = await inspectCaptureProducer(producer, context, {
  publicationTime: new Date().toISOString(), signal,
});
if (!result.valid) throw new Error('Capture artifact refused');
// Observe current server authorization and revalidate exact assets before publication.
```

Use existing Node24.21.0 dependencies, with no provider downloads or credentials:

```sh
node --test providers/providers.test.mjs
npm run conformance:providers
```

The checks include two real file-backed public producer outputs on the same asset, exact SHA/bytes, corruption/path escape/rights/version refusal, opaque-context session projection, expiration/tenant/role/secret-field refusal, cancellation and unsupported fallback. Synthetic server-session tests do **not** verify a real alternate auth deployment, revocation integration, a physical Capture producer, or cross-provider execution of the same live exhibition. Those original T12-03 checks remain NOT_RUN. Existing File/S3 BlobStore and OED/deployment contracts are reused rather than replaced by this optional interface. Unknown provider versions require an explicit future adapter; no automatic migration exists.
