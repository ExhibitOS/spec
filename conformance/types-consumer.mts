// SPDX-License-Identifier: Apache-2.0
import { validateArtwork, validateExhibition, validateLifecycle, validateOed, validateOexManifest, runConformance, schemaURL } from '@exhibitos/spec';
import type { Artwork, Exhibition, Lifecycle, OedDeployment, OexManifest } from '@exhibitos/spec';
const check=(art: Artwork,exhibition: Exhibition,lifecycle: Lifecycle,oed: OedDeployment,oex: OexManifest)=>{
 const result=validateArtwork(art);const boolean: boolean=result.valid;
 validateExhibition(exhibition);validateLifecycle(lifecycle,exhibition);validateOed(oed);validateOexManifest(oex);return boolean;
};
void check;void runConformance;void schemaURL('artwork');
// @ts-expect-error Unsupported named schema
schemaURL('unknown');
// @ts-expect-error A mismatched draft version cannot typecheck
const wrong: Artwork['schemaVersion']='2.0.0';
// @ts-expect-error Quaternion must have exactly four numbers
const rotation: Artwork['transform']['rotation']=[0,0,1];
// @ts-expect-error Lifecycle discriminant is a closed union
const kind: Lifecycle['kind']='unknown';
void wrong;void rotation;void kind;

import {readOex,writeOex,OEX_MEDIA_VERSION,packageMediaAssetManifest} from '@exhibitos/spec';
const mediaVersion: '1.0.0-draft.2' = OEX_MEDIA_VERSION;
void mediaVersion;
async function roundTrip(bytes:Uint8Array){const result=await readOex(bytes);const entries=new Map<string,Uint8Array>();for(const asset of result.manifest.assets)entries.set(asset.artifactPath,result.files.get(asset.path)!);const inventory=packageMediaAssetManifest(result.exhibition);void inventory;return writeOex(result.exhibition,entries,{createdAt:result.manifest.createdAt,generator:result.manifest.generator});}
void roundTrip;
