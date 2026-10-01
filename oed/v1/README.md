# OED deployment descriptor draft

Implemented **1.0.0-draft.1**: strict secret-reference schema and local validation.
No SSH connection, cloud provisioning, Docker/DB execution, DNS update or credential
resolution occurs. The examples' zero image digest is a labeled synthetic placeholder,
not evidence that an actual deployable image exists.

```sh
npm run validate:package -- oed oed/v1/examples/local.json
npm run validate:package -- oed oed/v1/examples/ssh.json
```

Use Node24.21.0/npm11.19.0 and `npm ci --ignore-scripts`. `validateOed` is available
from `validators/package.mjs`. Exact version, calendar-valid restricted UTC and
finite timestamp checks apply. All core objects are closed; arbitrary shell commands,
inline environment values, passwords, tokens and secret-value fields are rejected.

Target is `local-compose` or a typed `generic-ssh` host/port/user with a key reference.
Runtime records a digest-pinned OCI image, HTTP port and bounded replicas, optionally
a registry secret reference. Storage is PostgreSQL host/port/database/user with a
password reference, plus relative filesystem assets or HTTPS S3-compatible endpoint/
bucket with access-key and secret-key references. Provider adapters later validate
reachability, compatibility, filesystem permissions and supported backend behavior.

Secret references are locators only:

- `environment`: a reference ID and uppercase variable name, never its value.
- `os-keychain`: a reference ID and bounded service/account names, never key bytes.

Every required/optional reference must resolve to exactly one declared locator;
duplicates, missing IDs and unused locators reject. The validator does not read
environment variables or OS keychain. Descriptor text and labels still need producer
review: this is a typed reference boundary, not a claim every hidden secret can be
detected. Errors omit input values and the CLI does not dump descriptor metadata.

Examples use localhost or `host.example.invalid` and synthetic IDs only. The
separate operating environment supplies actual credentials through an approved
credential store. No literal fake password is embedded in normal examples; negative
tests use synthetic strings solely to prove unknown sensitive fields are rejected.

Unknown source/version rejects. No previous stable OED version or migration exists.
Spec owns future schema/adapters and executable migration fixtures; deployment and
manager own actual plan/apply/status/rollback, credential resolution and consumer
adoption. Existing OES Lifecycle freeze pins remain `oex/oed: not-used`; their published
schema identity was not changed to pretend integration already occurred.
