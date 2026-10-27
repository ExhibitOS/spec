// SPDX-License-Identifier: Apache-2.0
export type SurfaceMaterialPackId='museum-matte-paint'|'fine-lime-plaster';
export type SurfaceMaterialRole='color'|'roughness'|'normal';
export interface SurfaceMaterialMapFile {readonly path:string;readonly mime:'image/png';readonly bytes:number;readonly sha256:string;readonly sourceSha256:string;readonly width:2048;readonly height:2048;readonly channels:3;readonly bitDepth:8;readonly colorSpace:'srgb'|'linear'}
export interface SurfaceMaterialNoticeFile {readonly path:string;readonly mime:'text/plain; charset=utf-8';readonly bytes:number;readonly sha256:string}
export interface SurfaceMaterialPack {readonly id:SurfaceMaterialPackId;readonly version:1;readonly license:'CC0-1.0';readonly credit:string;readonly changes:string;readonly maps:Readonly<Record<SurfaceMaterialRole,SurfaceMaterialMapFile>>;readonly notice:SurfaceMaterialNoticeFile;readonly noticeText:string}
export interface SurfaceMaterialResourceEntry {packId:SurfaceMaterialPackId;packVersion:1;role:SurfaceMaterialRole|'notice';path:string;artifactPath:string;mime:'image/png'|'text/plain; charset=utf-8';bytes:number;sha256:string}
export declare const OEX_SURFACE_MATERIAL_VERSION:'1.0.0-draft.7';
export declare const MATERIAL_NAMESPACE:'org.exhibitos.studio/materials';
export declare const SURFACE_MATERIAL_PACKS:readonly SurfaceMaterialPack[];
export declare const SURFACE_MATERIAL_FILES:readonly Readonly<SurfaceMaterialResourceEntry>[];
export declare function selectedSurfaceMaterialPacks(revision:unknown):readonly SurfaceMaterialPack[];
export declare function packageSurfaceMaterialManifest(revision:unknown):SurfaceMaterialResourceEntry[];
export declare function surfaceMaterialNotice(pack:SurfaceMaterialPack):string;
