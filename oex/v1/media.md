# OEX media profile 1.0.0-draft.2

Draft.1 schemas/example archive hashes remain unchanged, supported by the same
reader. Draft.2 uses a distinct schema identity and explicit typed inventory.
OES Artwork/Exhibition remain 1.0.0-draft.1. `OEX_VERSION` remains draft.1;
`OEX_MEDIA_VERSION` names draft.2. No implicit upgrade/downgrade occurs.
Identity adapters accept the same exact supported version only; cross-profile
migration is rejected. A service can explicitly create a new draft.2 package from
an already validated draft.1 revision, retaining the original archive/hash in audit.

Each inventory entry has `kind: artwork|media` plus the original ID, exact byte
count/hash/MIME, artifactPath, assets-prefixed path and references. Artwork entries
retain all exact rights/provenance pointers. Media entries reference the actual
`exhibition.json#/mediaAssets/N/rights` object. OES draft.1 media contains no
provenance field, so its `provenanceReferences` is explicitly empty; it is not an
invented provenance assertion. Full inventory must equal the embedded snapshots.
Missing, extra, alias and conflicting assets reject. Export grants are checked
at manifest creation time for every artwork and media grant. Current approval,
revocation, tenant authorization and import-time grants remain service policy.

Media supports `audio/wav` only: RIFF/WAVE, PCM integer16 little endian, mono/stereo,
8–48kHz, consistent byte rate/block alignment, positive duration at most60seconds,
at most12MiB. Exactly one fmt16 chunk before exactly one nonempty aligned data
chunk is required. Unknown metadata/chunks, compressed/extensible encodings,
truncated/inconsistent size and MP3/OGG reject explicitly. Artwork binary checks
retain draft.1 signature/Khronos validation scope; images are not fully decoded.

```js
import {readOex,writeOex} from '@exhibitos/spec';
const {manifest,exhibition,files}=await readOex(archiveBytes);
const assets=new Map(manifest.assets.map(a=>[a.artifactPath,files.get(a.path)]));
const archive=await writeOex(exhibition,assets,{
  createdAt:'2026-10-02T09:00:00Z',generator:{name:'Example service',version:'1'}
});
```

Both APIs throw `OexError` with bounded public `code`/`errors` and no arbitrary
parser messages, paths or stack forwarded as validation data. Reader accepts
Buffer/Uint8Array, copies a bounded stable input snapshot before asynchronous
validation, and only returns files after whole validation succeeds. Returned maps
are owned in-memory data, not paths to extracted files. Writer accepts an exact
Map keyed artifact-relative path, validates the source revision/options and bounds
before asset allocation, creates owned bytes, validates them fully, then returns.
Writer emits STORE classic ZIP at fixed DOS time/date, manifest first, exhibition
second, inventory sorted by lowercased UUID; Map insertion order is irrelevant.
Repeated calls with the same JSON insertion order, data and options produce exact
bytes; semantic JSON key order is accepted but not promised byte-identical.

All existing ZIP limits apply:64MiB archive,256files,100MiB expanded/file,
256MiB aggregate,100:1ratio,1MiBJSON,240ASCIIpath. Never extract to the filesystem,
resolve external resources or use this as authorization. The library is bounded
but not a process sandbox: synchronous inflation and Khronos validation cannot be
interrupted by a Promise timeout. Production ingestion must run in a terminable
isolated worker/process with explicit wall-clock, CPU and memory limits, quarantine
and no network/private mounts. Kill that worker on timeout; validate approved
bytes again after storage retrieval and enforce transactional import separately.

Reproduce synthetic media fixture with `node scripts/generate-media-oex.mjs`.
It embeds the existing original CC0 GLB/PNG and original0.1second synthetic silence;
no recording/real artwork is used. Metadata is Apache-2.0; original audio is CC0.
Synthetic media archive:228817bytes, SHA256
`28b74acc1444d15f8a64a307350b784b4b86279cbd2ed5a31939ff3e57188f66`.
