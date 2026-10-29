// SPDX-License-Identifier: Apache-2.0
export type FootstepFamily='carpet'|'concrete'|'marble'|'tile'|'wood';
export interface FootstepResource {family:FootstepFamily|'shared';version:1;role:'sample'|'notice';mime:string;artifactPath:string;path:string;bytes:number;sha256:string}
export declare const OEX_FOOTSTEP_RESOURCE_VERSION:'1.0.0-draft.8';
export declare const FOOTSTEP_RESOURCE_NAMESPACE:'org.exhibitos.viewer/footstep-resources';
export declare const FOOTSTEP_FAMILIES:readonly FootstepFamily[];
export declare const FOOTSTEP_SAMPLES:readonly FootstepResource[];
export declare const FOOTSTEP_NOTICES:readonly FootstepResource[];
export declare function footstepResourcesFor(document:unknown):FootstepResource[];
