// SPDX-License-Identifier: Apache-2.0
import type {Artwork,ValidationResult} from './index.js';
export declare const PROVIDER_VERSION:'1.0.0-draft.1';
export type ProviderDescriptor={schemaVersion:'1.0.0-draft.1';id:string;version:string}&({kind:'auth-provider';contract:'session-observation-v1'}|{kind:'capture-producer';contract:'oes-artwork-v1'});
export interface SessionObservation {id:string;userId:string;tenantId:string;role:'admin'|'artist'|'curator'|'viewer';expiresAt:string}
export interface AuthProvider<C=unknown>{descriptor:ProviderDescriptor;resolveSession(context:C,options:{signal?:AbortSignal}):Promise<SessionObservation|null>}
export interface CaptureProducer<C=unknown>{descriptor:ProviderDescriptor;produceArtwork(context:C,options:{signal?:AbortSignal}):Promise<{document:Artwork;assetRoot:string}>}
export declare function validateProviderDescriptor(value:unknown):ValidationResult;
export declare function observeAuthSession<C>(adapter:AuthProvider<C>,context:C,options:{tenantId:string;now?:number;signal?:AbortSignal}):Promise<Readonly<SessionObservation>|null>;
export declare function inspectCaptureProducer<C>(adapter:CaptureProducer<C>,context:C,options?:{publicationTime?:string;signal?:AbortSignal}):Promise<ValidationResult&{document?:Artwork}>;
