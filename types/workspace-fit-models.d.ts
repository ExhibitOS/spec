// SPDX-License-Identifier: Apache-2.0
export type WorkspaceFitProfile='straight-ring-v1'|'continuous-portal-v1'|'modular-portal-v1'|'rectangular-portal-v1';
export type StraightRingFit={profile:'straight-ring-v1';openingWidth:number;openingHeight:number;imagePlaneZ:number};
export type ContinuousPortalFit={profile:'continuous-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number};
export type RectangularPortalFit={profile:'rectangular-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number};
export type ModularPortalRole=`${'reveal'|'front'|'back'}-${'left'|'right'|'head'}`;
export type ModularPortalPart={node:number;min:[number,number,number];max:[number,number,number]};
export type ModularPortalFit={profile:'modular-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number;parts:Record<ModularPortalRole,ModularPortalPart>};
export type WorkspaceFitGeometry=StraightRingFit|ContinuousPortalFit|ModularPortalFit|RectangularPortalFit;
export declare function workspaceFitGeometry(descriptor:unknown):WorkspaceFitGeometry|undefined;
export declare function qualifiedFrameTargetFit(geometry:StraightRingFit,width:number,height:number):{cornerX:number;cornerY:number}|undefined;
export declare function qualifiedPortalWallFit(geometry:ContinuousPortalFit,opening:{connectsToOpeningId?:string;offset?:number[]},wall:unknown,finish:{preset:string;depth:number}|undefined,openings:unknown):boolean;
export declare function modularPortalParts(geometry:unknown):geometry is ModularPortalFit;
export declare function qualifiedModularPortalTarget(geometry:ModularPortalFit,exhibition:unknown,openingId:string):{width:number;height:number;minZ:number;maxZ:number}|undefined;
export declare function qualifiedRectangularPortalTarget(geometry:RectangularPortalFit,exhibition:unknown,openingId:string):{width:number;height:number;minZ:number;maxZ:number}|undefined;
