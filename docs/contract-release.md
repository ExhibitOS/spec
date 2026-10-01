# Draft release and change checklist

1. Compare accepted/rejected wire data and semantic policy with the previous
   published schema identity. Never overwrite a released schema's bytes or ID.
   Any acceptance, interpretation, rights, hash profile or archive safety change
   needs explicit review; consumers can break even if JSON fields do not change.
2. During draft development, issue a new draft identity for contract changes.
   Package semver is independent of wire contract versions. Increment package
   version for changed code/artifacts; never republish different bytes at a
   previously distributed version. Stable promotion requires reviewed schemas,
   actual cross-consumer evidence and a published support/migration policy.
3. A breaking stable change requires a new major contract ID, support window,
   actual old-to-new adapter with positive/negative fixtures and rollback policy.
   Today only current OEX identity adaptation exists; reject unsupported sources
   and targets. No prior stable data or migration can be claimed.
4. Run `npm ci --ignore-scripts`, `npm run build`, `npm run check`, and
   `npm run artifact:check` from the public repository alone. Review generated
   schema hashes/types and pack inventory; verify fixture rights and license scope.
5. Consumers vendor the exact tarball, record SHA-256 and source commit, and lock
   npm integrity. Run the same API/CLI conformance plus each consumer's integration
   checks. Capture repository Node validation does not prove native iOS export,
   device compatibility, processing accuracy or browser rendering.
6. Root reviews PR and CI before merge. Create an immutable public tag/release
   only after approval gates pass, with the tarball, checksum, source commit,
   exact toolchain, contract versions, changes and limitations. This task supplies
   buildable artifacts; it does not silently publish a stable release.
7. Recover by retaining the previous digest-pinned tarball/lock and rolling back
   the consumer dependency. Actual database/data migration must use its own
   backup and rollback process; reverting validator code cannot migrate data.
