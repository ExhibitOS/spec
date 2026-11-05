// SPDX-License-Identifier: Apache-2.0
import type {Artwork,ValidationResult} from './index.js';
export type WorkspaceMaterialRole='color'|'normal'|'roughness'|'ao';
export interface WorkspaceMaterialMap {mime:'image/png';bytes:number;sha256:string;width:number;height:number;colorSpace:'srgb'|'linear';normalY?:'up'}
export interface WorkspaceMaterial {id:string;version:number;kind:'floor'|'wall';name:string;rights:Artwork['rights'];provenance:string;maps:{color:WorkspaceMaterialMap;normal?:WorkspaceMaterialMap;roughness?:WorkspaceMaterialMap;ao?:WorkspaceMaterialMap}}
export interface WorkspaceMaterialBinding {surfaceId:string;materialId:string;materialVersion:number;repeatMeters:[number,number];rotation:number;normalScale?:number;aoStrength?:number}
export interface WorkspaceMaterialBindings {version:1;materials:WorkspaceMaterial[];bindings:WorkspaceMaterialBinding[]}
/** Structural/semantic checks only; bytes, ownership and grant at use time remain caller responsibilities. */
export declare function validateWorkspaceMaterial(value:unknown):ValidationResult;
export declare function validateWorkspaceMaterialBindings(value:unknown,surfaces:unknown):ValidationResult;
