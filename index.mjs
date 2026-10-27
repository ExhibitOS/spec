// SPDX-License-Identifier: Apache-2.0
export { ARTWORK_VERSION, validateArtwork, validateArtworkFiles } from './validators/artwork.mjs';
export { EXHIBITION_VERSION, HASH_PROFILE, validateExhibition, validateExhibitionFiles, validateLifecycle, validateLifecycleFiles, revisionHash, assetInventory, sealDraft } from './validators/exhibition.mjs';
export { OEX_VERSION, OEX_MEDIA_VERSION, OEX_SPACE_STILL_VERSION, OEX_FLOOR_RESOURCE_VERSION, packageFloorResourceManifest, OED_VERSION, readOex, writeOex, OexError, packageMediaAssetManifest, packageSpaceStillAssetManifest, validateOexManifest, validateOed, adaptOexManifest } from './validators/package.mjs';
export { runConformance, fixtureURL, schemaURL } from './conformance/runner.mjs';

// Public byte view adapter: zero-copy Buffer view; existing parser enforces size bounds.
import { validateOex as validateOexBuffer } from './validators/package.mjs';
export function validateOex(bytes) {
  if(bytes instanceof Uint8Array && !Buffer.isBuffer(bytes))bytes=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  return validateOexBuffer(bytes);
}

export { SPATIAL_SCRIPTING_NAMESPACE, SPATIAL_SCRIPTING_VERSION, validateSpatialProgram, validateSpatialEvent, validateSpatialProfile, parseSpatialProgram, spatialScopeFor } from './validators/spatial-scripting.mjs';
export {SPACE_STILL_NAMESPACE,MAX_SPACE_STILL_BYTES,MAX_SPACE_STILL_PIXELS,MAX_SPACE_STILL_DIMENSION,validateSpaceStillInventory,spaceStillFor} from './validators/space-still.mjs';

export {FURNISHING_NAMESPACE,OEX_FURNISHING_VERSION,validateFurnishingInventory,packageFurnishingAssetManifest,packageFurnishingNoticeManifest} from './validators/furnishings.mjs';
export {packageCompleteAssetManifest} from './validators/package.mjs';

export {OEX_SURFACE_MATERIAL_VERSION,MATERIAL_NAMESPACE,SURFACE_MATERIAL_PACKS,SURFACE_MATERIAL_FILES,selectedSurfaceMaterialPacks,packageSurfaceMaterialManifest,surfaceMaterialNotice} from './validators/surface-material-resources.mjs';
