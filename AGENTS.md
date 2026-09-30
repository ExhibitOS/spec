# Spec agent instructions

This repository owns the public OES, OEX and OED contracts, compatibility policy,
synthetic fixtures and consumer conformance tools. Treat plans and research as
drafts until implementation and checks establish their acceptance criteria.

1. Read README.md, applicable contract documents and task prerequisites before editing.
2. Check branch, remote and working tree; preserve existing edits.
3. Use a `codex/` branch. Keep schemas, examples, validation and documentation in the same change.
4. Avoid build dependencies on operations or private Capture repositories. Consumers must validate public artifacts from this repository alone.
5. Do not require proprietary Capture metadata. Never commit credentials, private artwork, raw datasets or personal information.
6. Keep fixtures synthetic, deterministic and covered by explicit redistribution rights. Hash the exact file bytes; do not equate a rendered image with its source file.
7. Validate both accepted and rejected inputs. JSON Schema validation alone does not establish binary integrity, reference consistency, rights validity or archive safety.
8. Record contract versions and migration behavior. Reject unsupported versions explicitly; do not silently reinterpret them.
9. State tested environments and limitations precisely. No inferred mobile/device support or invented performance measurements.
10. Include checks, consumer impact, remaining work and recovery path in every handoff. Prerequisites and checks must pass before claiming task completion.
