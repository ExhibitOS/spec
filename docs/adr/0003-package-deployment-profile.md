# ADR0003: Closed bounded packages and secret-reference deployment descriptors

Status: adopted for draft implementation, 2026-10-01.

OEX manifest and OED deployment use new exact1.0.0-draft.1 identities in their own
version families. Existing published Artwork/Exhibition/Lifecycle schema identities
and example bytes remain unchanged. No stable release or legacy migration is invented.

Implement a conservative ZIP subset and in-memory validation, with fixed file,
size, ratio, path and inflation bounds. Cross-check local/central metadata and
contiguous ranges rather than trusting only directory declarations. Reject path
aliases, file/directory prefix conflicts and special files; never extract. Bind
all declared files/hashes and rights/provenance references to the embedded revision.
Using the pinned Node runtime's raw inflater avoids an additional ZIP dependency;
subset limitations are explicit and tested against adversarial ZIP buffers.

Export permissions are independent from display permissions. Recorded export grant
must be active at package creation and creation cannot predate an embedded snapshot.
Authenticity, importing-time grants and current authorization remain service policy.
Separate raw credential/Capture files are excluded by layout, while metadata review
is still required; arbitrary text cannot be comprehensively classified by this validator.

OED uses closed typed target/runtime/storage objects and env/keychain locators only.
Actual secrets are resolved outside artifacts by future deployment adapters. No
shell-command strings, inline environment values or secret literals are part of the
contract. Validation neither proves a credential exists nor provisions anything.

Current compatibility adapter validates and clones the same supported manifest;
its name expressly says identity-only-no-migration. Future real upgrades require
pinned source/target schemas, registered adapters, reproducible before/after fixtures,
source identity preservation and consumer support windows. Spec owns these contracts;
platform owns transactional import/ID remap, deployment/manager own provisioning.
