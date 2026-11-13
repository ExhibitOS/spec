// SPDX-License-Identifier: Apache-2.0
export type PassiveCeilingRailFit={profile:'passive-ceiling-rail-v1';min:[number,number,number];max:[number,number,number]};
export type WorkspaceFitProfile='passive-ceiling-rail-v1'|'straight-miter-ring-v1'|'straight-ring-v1'|'continuous-portal-v1'|'modular-portal-v1'|'rectangular-portal-v1';
export type StraightRingFit={profile:'straight-ring-v1';openingWidth:number;openingHeight:number;imagePlaneZ:number};
export type StraightMiterRingFit={profile:'straight-miter-ring-v1';openingWidth:number;openingHeight:number;imagePlaneZ:number};
export type MeasuredFrameFit=StraightRingFit|StraightMiterRingFit;
export type ContinuousPortalFit={profile:'continuous-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number};
export type RectangularPortalFit={profile:'rectangular-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number};
export type ModularPortalRole=`${'reveal'|'front'|'back'}-${'left'|'right'|'head'}`;
export type ModularPortalPart={node:number;min:[number,number,number];max:[number,number,number]};
export type ModularPortalFit={profile:'modular-portal-v1';openingWidth:number;openingHeight:number;minZ:number;maxZ:number;parts:Record<ModularPortalRole,ModularPortalPart>};
export type WorkspaceFitGeometry=PassiveCeilingRailFit|MeasuredFrameFit|ContinuousPortalFit|ModularPortalFit|RectangularPortalFit;
export declare function workspaceFitGeometry(descriptor:unknown):WorkspaceFitGeometry|undefined;
export declare function qualifiedFrameTargetFit(geometry:MeasuredFrameFit,width:number,height:number):{cornerX:number;cornerY:number}|undefined;
export declare function qualifiedPortalWallFit(geometry:ContinuousPortalFit,opening:{connectsToOpeningId?:string;offset?:number[]},wall:unknown,finish:{preset:string;depth:number}|undefined,openings:unknown):boolean;
export declare function modularPortalParts(geometry:unknown):geometry is ModularPortalFit;
export declare function qualifiedModularPortalTarget(geometry:ModularPortalFit,exhibition:unknown,openingId:string):{width:number;height:number;minZ:number;maxZ:number}|undefined;
export declare function qualifiedRectangularPortalTarget(geometry:RectangularPortalFit,exhibition:unknown,openingId:string):{width:number;height:number;minZ:number;maxZ:number}|undefined;

export type FrameImageFit={version:1;profile:'contain-contact-v1';sourceSha256:string;pixelWidth:number;pixelHeight:number};
export declare const FRAME_IMAGE_FIT_LIMITS:Readonly<{edge:8192;pixels:25165824}>;
export declare const FRAME_IMAGE_CONTACT_EPSILON_METRES:0.000001;
export declare function frameImageFootprintForArtwork(candidate:unknown,artwork:unknown):{width:number;height:number}|undefined;
export declare function frameImageContactFit(candidate:unknown,attachment:unknown,artwork:unknown,geometry:MeasuredFrameFit):{cornerX:number;cornerY:number}|undefined;
export declare function qualifiedFrameAttachmentTransform(candidate:unknown,placement:unknown,artwork:unknown,geometry:MeasuredFrameFit|undefined,version:number):{scaleX:number;scaleY:number;rigidFrame:boolean}|undefined;
export declare function frameAttachmentMetricFit(candidate:unknown,attachment:unknown,artwork:unknown,geometry:MeasuredFrameFit):{cornerX:number;cornerY:number;rigidFrame:boolean}|undefined;
