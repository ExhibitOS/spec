// SPDX-License-Identifier: Apache-2.0
export interface ArtworkFrameModel {readonly id:string;readonly version:1;readonly sha256:string;readonly bytes:number;readonly openingWidth:number;readonly openingHeight:number;readonly front:'-Z';readonly wallAnchorZ:0;readonly imagePlaneZ:number;readonly depth:number}
export declare function artworkFrameModel(sha256:string,bytes:number):Readonly<ArtworkFrameModel>|undefined;
