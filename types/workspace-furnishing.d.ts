// SPDX-License-Identifier: Apache-2.0
import type {ValidationResult} from './index.js';
export interface WorkspaceFurnishingResource {furnishingId:string;furnishingVersion:1;path:string;artifactPath:string;mime:'model/gltf-binary';bytes:number;sha256:string}
export declare const WORKSPACE_FURNISHING_NAMESPACE:'org.exhibitos.studio/workspace-furnishings';
export declare function validateWorkspaceFurnishings(value:unknown,exhibition:unknown):ValidationResult;
export declare function packageWorkspaceFurnishingManifest(exhibition:unknown):WorkspaceFurnishingResource[];
