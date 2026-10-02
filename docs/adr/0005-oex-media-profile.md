# ADR0005: Versioned OEX media and bounded public byte APIs

Status: implemented draft candidate, 2026-10-02; no stable/registry release.

Preserve all OES/OEX draft.1 schema identities and example bytes. Add distinct
OEX1.0.0-draft.2 typed artwork/media inventory and public read/write APIs in
package0.1.0-draft.2. Support PCM16 WAV already representable by OES mediaAssets;
other document audio MIME values remain unsupported by this binary profile.
Do not invent provenance data absent from the embedded OES schema.

Use existing narrow in-memory ZIP decoder and independently implemented bounded
PCM checks without private code or external codecs. Public deterministic STORE
writer validates the final archive before return. Stable input snapshots prevent
caller mutation during asynchronous validation. Root byte read errors are bounded
safe codes; service workers supply isolation, timeouts and current rights checks.

Both versions read without migration. Identity-only adapter cannot silently
reinterpret a source as another target profile. Service import transactions and
ID-remap remain Platform responsibilities. Recovery is retaining source archive
and using the existing pinned draft.1 artifact; public schemas never get replaced.
