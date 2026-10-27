// SPDX-License-Identifier: Apache-2.0
export type FloorPackId='WoodFloor051'|'Marble006'|'Tiles074'|'Carpet004';
export type FloorMapRole='color'|'roughness'|'normal'|'ao';
export interface FloorMapFile {readonly path:string;readonly mime:'image/png';readonly bytes:number;readonly sha256:string;readonly width:1024;readonly height:1024;readonly channels:3;readonly bitDepth:8;readonly colorSpace:'srgb'|'linear'}
export interface FloorNoticeFile {readonly path:string;readonly mime:'text/plain; charset=utf-8';readonly bytes:number;readonly sha256:string}
export interface FloorResourcePack {readonly id:FloorPackId;readonly version:1;readonly maps:Readonly<Partial<Record<FloorMapRole,FloorMapFile>>>;readonly notice:FloorNoticeFile;readonly credit:string;readonly source:string;readonly license:'CC0-1.0';readonly licenseSource:string;readonly changes:string}
export interface FloorResourceEntry {packId:FloorPackId;packVersion:1;role:FloorMapRole|'notice';path:string;artifactPath:string;mime:'image/png'|'text/plain; charset=utf-8';bytes:number;sha256:string}
export declare const OEX_FLOOR_RESOURCE_VERSION:'1.0.0-draft.5';
export declare const FLOOR_NAMESPACE:'org.exhibitos.studio/floors';
export declare const FLOOR_RESOURCE_PACKS:readonly FloorResourcePack[];
export declare const FLOOR_RESOURCE_FILES:readonly Readonly<FloorResourceEntry>[];
export declare function selectedFloorResourcePacks(document:unknown):readonly FloorResourcePack[];
export declare function packageFloorResourceManifest(document:unknown):FloorResourceEntry[];
export declare function floorResourceNotice(pack:FloorResourcePack):string;
