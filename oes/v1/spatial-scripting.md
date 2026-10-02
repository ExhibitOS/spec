<!-- SPDX-License-Identifier: Apache-2.0 -->
# Optional Spatial Scripting version1

The `org.exhibitos.runtime/spatial-scripting` Exhibition extension contains
`{version:1,rules:[{id,trigger,actions,once}]}`. The public closed schema and
Node semantic validator are independent Apache-2.0 code. Program syntax agrees
with Platform's standalone development program, but public targets are exact
UUID references, not free-form host IDs. Unsupported own versions fail closed.
No base wire version changes; reserved OES `scripts` remain disabled and are
never automatically migrated or executed.

Triggers: room_enter/room_leave(roomId), zone_enter/zone_leave(zoneId),
artwork_approach/artwork_look/artwork_click(placementId), exhibition_start/end,
elapsed_time(atMs), absolute_time(atUtc), custom_event(name). Host-normalized
approach/look edges supply detection; this contract does not infer perception.
Actions: set_light(lightId,multiplier), play_audio(mediaAssetId,volume),
stop_audio(mediaAssetId), show_text(text,locale),
set_artwork_visibility(placementId,visible), emit_event(name).
Every action has an explicit delayMs integer0..3600000; elapsed trigger atMs
has the same range. Numeric multipliers/volume are finite0..1. UUID fields must
resolve exactly, including letter case, in this Exhibition's rooms/audioZones/
placements/lights/mediaAssets. Stable rule IDs/custom names have1..64 ASCII
identifier characters; raw JavaScript, URLs, file/OS/network actions and extra
fields are unsupported.

Maximum32 rules,16 actions/rule,4096 code units/text,32 returned errors.
Standalone JSON is at most32768 UTF-8 bytes; the embedded profile is at most
16384 bytes, preserving OES's existing extension cap. UTC strings must be
canonical `YYYY-MM-DDTHH:mm:ss.sssZ` with actual calendar dates and epoch
milliseconds0..4102444800000 inclusive (1970-01-01 through2100-01-01). JSON Schema
alone cannot establish UUID target ownership, duplicate rule identity, total
byte length, this temporal range or runtime capabilities; use semantic validation.
Node APIs reject getters/proxies/cycles/sparse/exotic/nonfinite values; untrusted
interchange should enter `parseSpatialProgram` as bounded JSON text.

`validateExhibition` validates this known profile, including nested lifecycle
and OEX calls. Unknown foreign namespaces retain existing opaque metadata rules;
this does not grant runtime support. Validators never execute programs. Runtime
hosts must enforce current rights and capabilities at execution, sound consent,
deterministic ordered AFTER handling, cancellation and bounded recursion/queue/
session budgets. No server-wide or other-visitor state mutation is authorized.
Block editors and actual Viewer/server tests are Platform integration work.

Synthetic spatial examples reference existing explicitly CC0 generated audio and
art assets; new schemas/code/document metadata are Apache-2.0. Original fixture
bytes are unchanged. Package0.1.0-draft.3 is a development artifact, not a stable
or registry release. Consumers can roll back their pinned tarball and lockfile;
unsupported consumers may ignore this optional namespace but must not execute it.
