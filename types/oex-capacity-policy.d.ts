// SPDX-License-Identifier: Apache-2.0
export interface OexCapacityPolicy {
 readonly schemaVersion: 1;
 readonly format: Readonly<{archiveBytesMax:number;expandedBytesMax:number;entryBytesMax:number;entryCountMax:number;expansionRatioMax:number}>;
 readonly exhibition: Readonly<{uniqueAssetBytesMax:number;assetBytesMax:number}>;
 readonly nativeImport: Readonly<{chunkBytes:number}>;
 readonly packed: Readonly<{resourceCountMax:number}>;
}
export declare function validateOexCapacityPolicy(value:unknown): OexCapacityPolicy;
export declare const OEX_CAPACITY_POLICY: OexCapacityPolicy;
