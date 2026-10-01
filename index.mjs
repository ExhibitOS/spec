// SPDX-License-Identifier: Apache-2.0
export { ARTWORK_VERSION, validateArtwork, validateArtworkFiles } from './validators/artwork.mjs';
export { EXHIBITION_VERSION, HASH_PROFILE, validateExhibition, validateExhibitionFiles, validateLifecycle, validateLifecycleFiles, revisionHash, assetInventory, sealDraft } from './validators/exhibition.mjs';
export { OEX_VERSION, OED_VERSION, validateOexManifest, validateOed, adaptOexManifest } from './validators/package.mjs';
export { runConformance, fixtureURL, schemaURL } from './conformance/runner.mjs';

// Public byte view adapter: zero-copy Buffer view; existing parser enforces size bounds.
import { validateOex as validateOexBuffer } from './validators/package.mjs';
export function validateOex(bytes) {
  if(bytes instanceof Uint8Array && !Buffer.isBuffer(bytes))bytes=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  return validateOexBuffer(bytes);
}
