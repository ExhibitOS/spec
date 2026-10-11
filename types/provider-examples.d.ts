// SPDX-License-Identifier: Apache-2.0
import type {AuthProvider,CaptureProducer,SessionObservation} from './providers.js';
export declare function fileArtworkProducer():Promise<CaptureProducer>;
export declare function memoryArtworkProducer():Promise<CaptureProducer>;
export declare function localSessionAdapter<C>(resolve:(context:C,options:{signal?:AbortSignal})=>Promise<SessionObservation|null>):Promise<AuthProvider<C>>;
