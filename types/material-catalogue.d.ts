// SPDX-License-Identifier: Apache-2.0
/** Compiled catalogue presentation. These fields never enter saved bindings. */
export interface MaterialCataloguePresentation {
 readonly displayName: Readonly<{ en:string; ko:string }>;
 readonly defaultRepeatMeters: readonly [number,number];
 readonly thumbnail: Readonly<{ path:string; mime:'image/png'; bytes:number; sha256:string; width:number; height:number }>;
}
