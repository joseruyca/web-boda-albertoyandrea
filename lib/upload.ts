'use client';
import {requestJSON} from './http.mjs';
type Plan={id:string;uploadUrl?:string;thumbnailUploadUrl?:string;duplicate?:boolean;stored?:boolean};
type Options={memberId?:string;moment?:string;signal?:AbortSignal;onStage?:(message:string)=>void};
const prefix='wedding-upload:v3:';
const aborted=()=>new DOMException('Subida interrumpida.','AbortError');
const preserved=(signal?:AbortSignal)=>signal?.reason==='pause'||signal?.reason==='navigation';
async function request(path:string,body:unknown,signal?:AbortSignal){return requestJSON('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal},20000);}
async function fingerprint(file:File){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');}
function forget(key:string){try{localStorage.removeItem(key);}catch{}}
export function unfinishedUploads(){try{return Object.keys(localStorage).filter(k=>k.startsWith(prefix)).length;}catch{return 0;}}
export async function discardUpload(file:File){const key=prefix+await fingerprint(file);let id:string|null=null;try{id=localStorage.getItem(key);}catch{}if(id)await request('media/cancel',{id});forget(key);}
async function delay(ms:number,signal?:AbortSignal){if(signal?.aborted)throw aborted();await new Promise<void>((resolve,reject)=>{const finish=()=>{signal?.removeEventListener('abort',cancel);resolve();};const timer=setTimeout(finish,ms);const cancel=()=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);reject(aborted());};signal?.addEventListener('abort',cancel,{once:true});});}
async function connected(signal?:AbortSignal,onStage?:Options['onStage']){
 if(signal?.aborted)throw aborted();if(typeof navigator==='undefined'||navigator.onLine!==false)return;
 onStage?.('Sin conexión. Esperando para continuar…');
 await new Promise<void>((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);window.removeEventListener('online',online);signal?.removeEventListener('abort',cancel);};const online=()=>{cleanup();resolve();};const cancel=()=>{cleanup();reject(aborted());};const timer=setTimeout(()=>{cleanup();reject(Error('Sigue sin haber conexión. Pulsa Reintentar cuando vuelva.'));},120000);window.addEventListener('online',online,{once:true});signal?.addEventListener('abort',cancel,{once:true});if(navigator.onLine)online();});
}
async function put(url:string,body:Blob,onProgress:(percent:number)=>void,signal?:AbortSignal){
 if(signal?.aborted)throw aborted();
 await new Promise<void>((resolve,reject)=>{
  const xhr=new XMLHttpRequest();let settled=false;let stall:ReturnType<typeof setTimeout>;let maximum:ReturnType<typeof setTimeout>;
  const finish=(error?:Error)=>{if(settled)return;settled=true;clearTimeout(stall);clearTimeout(maximum);signal?.removeEventListener('abort',cancel);error?reject(error):resolve();};
  const cancel=()=>{finish(aborted());xhr.abort();};
  const inactive=()=>{finish(Error('La transferencia se ha detenido. Puedes reintentar el archivo.'));xhr.abort();};
  const active=()=>{clearTimeout(stall);stall=setTimeout(inactive,120000);};
  xhr.open('PUT',url);xhr.setRequestHeader('Content-Type',body.type);xhr.timeout=0;
  xhr.upload.onprogress=e=>{active();if(e.lengthComputable)onProgress(Math.min(99,Math.round(e.loaded/e.total*100)));};
  xhr.onload=()=>xhr.status>=200&&xhr.status<300?finish():finish(Object.assign(Error(xhr.status===402?'El álbum ha alcanzado su capacidad. Avisa a los novios.':'No se pudo guardar el archivo ('+xhr.status+').'),{status:xhr.status}));
  xhr.onerror=()=>finish(Error('Se ha interrumpido la conexión.'));xhr.onabort=()=>finish(aborted());
  signal?.addEventListener('abort',cancel,{once:true});active();maximum=setTimeout(inactive,1800000);xhr.send(body);
 });
}
export async function uploadMemory(file:File,author:string,onProgress:(percent:number)=>void,caption='',options:Options={}){
 const {signal,onStage}=options;const check=()=>{if(signal?.aborted)throw aborted();};check();await connected(signal,onStage);onStage?.('Comprobando el archivo…');const contentHash=await fingerprint(file);check();
 const storeKey=prefix+contentHash;let id:string|null=null;let plan:Plan|undefined;try{id=localStorage.getItem(storeKey);}catch{}
 try{
  if(id){try{await request('media/complete',{id},signal);forget(storeKey);onProgress(100);return {id,duplicate:false};}catch(e){check();if([403,404].includes((e as {status?:number}).status||0))id=null;}if(id)try{plan=await request('media/resume',{id},signal);}catch(error){check();if([403,404].includes((error as {status?:number}).status||0))id=null;else throw error;}}
  if(!plan)plan=await request('media/prepare',{name:file.name,size:file.size,mime:file.type,author,caption,contentHash,memberId:options.memberId,moment:options.moment},signal);let target=plan!;id=target.id;
  if(target.duplicate){forget(storeKey);onProgress(100);return {id,duplicate:true};}
  if(!target.uploadUrl&&!target.stored)throw Error('Actualiza la página antes de volver a subir.');try{localStorage.setItem(storeKey,id!);}catch{}
  let saved=!!target.stored;
  for(let attempt=0;attempt<3&&!saved;attempt++){
   check();await connected(signal,onStage);
   if(attempt){onStage?.('Recuperando la subida…');await delay(attempt*1000,signal);target=await request('media/resume',{id},signal);if(target.stored){saved=true;break;}}
   onStage?.(attempt?'Reenviando el original si es necesario…':'Subiendo el original…');
   try{await put(target.uploadUrl!,file,onProgress,signal);saved=true;break;}catch(error){check();try{await request('media/complete',{id},signal);saved=true;break;}catch{check();}if([400,402,413,415].includes((error as {status?:number}).status||0))throw error;}
  }
  if(!saved)throw Error('No se ha podido terminar. Puedes reintentar este archivo cuando mejore la conexión.');
  if(target.thumbnailUploadUrl){onStage?.('Preparando la vista previa…');try{const {memoryThumbnail}=await import('./thumbnail');const thumbnail=await memoryThumbnail(file,signal);check();if(thumbnail)await put(target.thumbnailUploadUrl,thumbnail,()=>{},signal);}catch{check();}}
  check();onStage?.('Guardando el recuerdo…');await request('media/complete',{id},signal);forget(storeKey);onProgress(100);return {id,duplicate:false};
 }catch(error){
  if(signal?.aborted){if(!preserved(signal)){if(id)try{await request('media/cancel',{id});}catch{}forget(storeKey);}throw aborted();}
  throw error;
 }
}
