// SPDX-License-Identifier: Apache-2.0
import type {SpaceStillInventory,ValidationResult,PublicationOptions} from './index.js';
export type SpaceStillAsset=SpaceStillInventory['asset'];
export declare const SPACE_STILL_NAMESPACE:'org.exhibitos.viewer/space-still';
export declare const MAX_SPACE_STILL_BYTES:8388608;
export declare const MAX_SPACE_STILL_PIXELS:2097152;
export declare const MAX_SPACE_STILL_DIMENSION:2048;
export declare function validateSpaceStillInventory(exhibition:unknown,options?:PublicationOptions):ValidationResult&{asset?:SpaceStillAsset};
export declare function spaceStillFor(exhibition:unknown):SpaceStillAsset|undefined;
