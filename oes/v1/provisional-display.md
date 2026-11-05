# Provisional display for an unknown source unit

Artwork `1.0.0-draft.2` is an explicit opt-in for a sculpture whose source
coordinates have no verified physical unit. It does not change the published
`1.0.0-draft.1` schema or the meaning of its metre dimensions. A draft.2
exhibition can contain both versions; its draft, publication and freeze lifecycle
envelopes use `1.0.0-draft.2`. Earlier readers must reject these identities.

The draft.2 artwork sets `units` to `unknown`; `dimensions` are the XYZ extents
of its declared raw scene bounds, in the original unknown coordinate unit.
The required `org.exhibitos.studio/display-reference` qualification records
the raw minimum and maximum, the exact primary GLB SHA-256, a selected display
height in metres, catalogue-reported dimensions in metres, and the explicit
`axisMapping: unverified` status. Catalogue dimensions are reported information;
they do not establish a mapping to GLB axes or a physical calibration.

The original GLB, including its nodes and vertices, is not rewritten. The
artifact transform is an explicit provisional uniform display scale: zero
position, identity rotation, and a scale equal to the selected display height
divided by the raw Y extent. Validation compares each scale component with a
tolerance of `max(1e-12, abs(expected) * 1e-9)`. Raw bounds must be finite,
ordered and no wider than 10,000 source units per axis; declared dimensions
must match their extents within `max(1e-9, abs(extent) * 1e-9)`. The scale
must also fit the existing bounded affine profile. No unit conversion event can
be claimed for this unknown-unit model. These checks validate a declared
reference and its binding, not a measurement of the GLB or its physical source.

Consumers display the catalogue dimensions separately and label the display
reference as provisional and uncalibrated. They must not present raw extents
as metres. Rendered geometry and its assertion and collision envelopes use the
raw extents and the existing artifact transform exactly once, followed by the
placement and room transforms. No metadata-based refit or second scale is
permitted. Front orientation and physical floor contact are not implied.

OEX `1.0.0-draft.11` explicitly declares this versioned exhibition and the
draft.2 artwork support profile; it retains the existing resource and optional
bounded-file safeguards. It preserves mixed draft.1 and draft.2 artwork without
rewriting either. OEX draft.1 through draft.10 and earlier readers do not accept
the new profile. Native applications need separately qualified format support;
an OEX11 export does not by itself demonstrate an application's import support.
