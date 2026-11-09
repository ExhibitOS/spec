// SPDX-License-Identifier: Apache-2.0
const legacy=Object.freeze({sha256:'385a3a6d5266a5dda5b3fc6e51fd14e0b990e29de66ee27a80b634a93ef2591b',bytes:164044,width:2.4,height:2.6,paired:false});
const pale=Object.freeze({sha256:'62fd3bc49e0e77ffde26f60dee7ddfbbac0939347d68ea53a94700de0695f1ae',bytes:2468,width:2.4,height:3,paired:true});
export function portalFinishModel(sha256,bytes){return [legacy,pale].find(model=>model.sha256===sha256&&model.bytes===bytes);}

const near=(a,b)=>typeof a==='number'&&Math.abs(a-b)<=1e-6;
const key=id=>typeof id==='string'?id.toLowerCase():undefined;
function single(rows,id){
 if(!id||!Array.isArray(rows))return undefined;
 const matching=rows.filter(row=>key(row?.id)===id);
 return matching.length===1?matching[0]:undefined;
}
function levelYaw(transform){
 const {position,rotation,scale}=transform??{};
 if(!Array.isArray(position)||position.length!==3||!position.every(Number.isFinite)||!Array.isArray(scale)||scale.length!==3||!scale.every(n=>n===1)||!Array.isArray(rotation)||rotation.length!==4||!rotation.every(Number.isFinite)||rotation[0]!==0||rotation[2]!==0||!near(rotation[1]**2+rotation[3]**2,1))return undefined;
 return 2*Math.atan2(rotation[1],rotation[3]);
}
function rotate(x,z,yaw){return [x*Math.cos(yaw)+z*Math.sin(yaw),-x*Math.sin(yaw)+z*Math.cos(yaw)];}
function floorPose(doc,opening){
 if(opening?.type!=='door'||!near(opening.dimensions?.width,pale.width)||!near(opening.dimensions?.height,pale.height)||!Array.isArray(opening.offset)||opening.offset.length!==2||!opening.offset.every(Number.isFinite))return undefined;
 const wall=single(doc.surfaces,key(opening.surfaceId)),room=single(doc.rooms,key(wall?.roomId));
 if(wall?.type!=='wall')return undefined;
 const wallYaw=levelYaw(wall.transform),roomYaw=levelYaw(room?.transform);
 if(wallYaw===undefined||roomYaw===undefined)return undefined;
 const [ox,oz]=rotate(opening.offset[0],0,wallYaw),[wx,wy,wz]=wall.transform.position;
 const [x,z]=rotate(wx+ox,wz+oz,roomYaw),[rx,ry,rz]=room.transform.position;
 const floor=wy+opening.offset[1]-pale.height/2;
 if(!near(floor,0))return undefined;
 return {wallId:key(wall.id),roomId:key(room.id),x:x+rx,y:floor+ry,z:z+rz,yaw:wallYaw+roomYaw};
}

/** The asymmetric reveal covers a measured pair of parallel finished wall faces. */
export function pairedPortalFit(doc,openingId){
 const id=key(openingId),opening=single(doc.openings,id),mateId=key(opening?.connectsToOpeningId);
 const mate=single(doc.openings,mateId);
 if(!mate||mateId===id||key(mate.connectsToOpeningId)!==id)return false;
 const host=floorPose(doc,opening),other=floorPose(doc,mate);
 if(!host||!other||host.roomId===other.roomId||!near(host.y,other.y)||(Math.cos(host.yaw-other.yaw)>=0||!near(Math.sin(host.yaw-other.yaw),0)))return false;
 const [x,z]=rotate(other.x-host.x,other.z-host.z,-host.yaw);
 if(!near(x,0)||!near(z,-.020))return false;
 const finishes=doc.extensions?.['org.exhibitos.studio/architectural-finishes']?.walls;
 if(!Array.isArray(finishes))return false;
 const own=finishes.filter(f=>key(f?.surfaceId)===host.wallId),opposite=finishes.filter(f=>key(f?.surfaceId)===other.wallId);
 return own.length===1&&opposite.length===1&&near(own[0].depth,.120)&&own[0].preset==='plain'&&near(opposite[0].depth,.120)&&['painted-edge','dark-edge'].includes(opposite[0].preset);
}
