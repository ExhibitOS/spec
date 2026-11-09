// SPDX-License-Identifier: Apache-2.0
export type WorkspaceFitProfile='straight-ring-v1'|'continuous-portal-v1';
export type StraightRingFit={profile:'straight-ring-v1';openingWidth:number;openingHeight:number;imagePlaneZ:number};
export type ContinuousPortalFit={profile:'continuous-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number};
export type WorkspaceFitGeometry=StraightRingFit|ContinuousPortalFit;
export declare function workspaceFitGeometry(descriptor:unknown):WorkspaceFitGeometry|undefined;
export declare function qualifiedFrameTargetFit(geometry:StraightRingFit,width:number,height:number):{cornerX:number;cornerY:number}|undefined;
export declare function qualifiedPortalWallFit(geometry:ContinuousPortalFit,opening:{connectsToOpeningId?:string;offset?:number[]},wall:{dimensions?:{width:number;height:number}},finish:{preset:string;depth:number}|undefined):boolean;
