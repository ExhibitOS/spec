// SPDX-License-Identifier: Apache-2.0
export interface PortalFinishModel {readonly sha256:string;readonly bytes:number;readonly width:number;readonly height:number;readonly paired:boolean}
export declare function portalFinishModel(sha256:string,bytes:number):Readonly<PortalFinishModel>|undefined;
export declare function pairedPortalFit(document:unknown,openingId:string):boolean;
