# Optional recorded footstep resources, draft.8

An exhibition may explicitly declare `org.exhibitos.viewer/footstep-resources`
as `{ "version": 1, "families": ["carpet", "wood"] }`. The family list is
nonempty, unique and sorted in ASCII order. The registered families are carpet,
concrete, marble, tile and wood. Absence retains the existing legacy behavior;
unknown versions, families or malformed declarations are errors.

The declaration identifies only the exact registered CC0 display derivatives,
not an arbitrary URL, uploaded recording, or a new permission for unrelated
media. Draft.8 binds each selected WAV and the shared rights/provenance files
to fixed paths, sizes and SHA-256 values. The archive must contain exactly those
registered resources and existing applicable artwork, media, floor, furnishing
and surface material resources. The WAV files must also satisfy the existing
bounded PCM16 profile. Current authorization and publication display rights
remain the responsibility of the producer and consumer.

Drafts 1 through 7 keep their existing meaning and bytes. Draft.8 requires an
explicit selection and older readers reject it as unsupported; this is not a
silent upgrade or downgrade. The declaration is not a visitor consent to play
audio, and does not override a floor's authored mute or explicit recording.
