export type CeilingRailAttachment={placementId:string;surfaceId:string;anchor:[number,number];yaw:number;gap:number};
export declare function ceilingRailAttachmentMatrix(surface:any,attachment:CeilingRailAttachment):{local:number[][];matrix:number[][]};
export declare function ceilingRailDerivedPose(matrix:number[][]):{position:[number,number,number];yaw:number;scale:1};
export declare function validateCeilingRailAttachments(value:any,exhibition:any):{code:string;path:string;message:string}[];
export declare function passiveCeilingRailGeometry(value:unknown):boolean;
