'use client';
type Plan={id:string;uploadUrl?:string;thumbnailUploadUrl?:string;duplicate?:boolean};
type Options={signal?:AbortSignal;onStage?:(message:string)=>void};
const aborted=()=>new DOMException('Subida cancelada.','AbortError');
async function request(path:string,body:unknown,signal?:AbortSignal){const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error||'No se pudo completar la subida.'),{status:r.status});return value;}
async function put(url:string,body:Blob,onProgress:(percent:number)=>void,signal?:AbortSignal){
 if(signal?.aborted)throw aborted();
 await new Promise<void>((resolve,reject)=>{const xhr=new XMLHttpRequest();let settled=false;const finish=(error?:Error)=>{if(settled)return;settled=true;signal?.removeEventListener('abort',cancel);error?reject(error):resolve();};const cancel=()=>{xhr.abort();finish(aborted());};xhr.open('PUT',url);xhr.setRequestHeader('Content-Type',body.type);xhr.timeout=180000;xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(99,Math.round(e.loaded/e.total*100)));};xhr.onload=()=>xhr.status>=200&&xhr.status<300?finish():finish(Error('No se pudo guardar el archivo ('+xhr.status+').'));xhr.onerror=()=>finish(Error('Se ha interrumpido la conexión.'));xhr.ontimeout=()=>finish(Error('La subida ha tardado demasiado.'));xhr.onabort=()=>finish(aborted());signal?.addEventListener('abort',cancel,{once:true});xhr.send(body);});
}
export async function uploadMemory(file:File,author:string,onProgress:(percent:number)=>void,caption='',options:Options={}){
 const {signal,onStage}=options;const check=()=>{if(signal?.aborted)throw aborted();};check();onStage?.('Comprobando el archivo…');const contentHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer()))).map(b=>b.toString(16).padStart(2,'0')).join('');check();
 const storeKey='wedding-upload:v3:'+contentHash;let id:string|null=null;let plan:Plan|undefined;
 try{id=localStorage.getItem(storeKey);}catch{}
 try{
  if(id){try{await request('media/complete',{id},signal);try{localStorage.removeItem(storeKey);}catch{}onProgress(100);return {id,duplicate:false};}catch(e){check();if([403,404].includes((e as {status?:number}).status||0))id=null;}if(id)try{plan=await request('media/resume',{id},signal);}catch{check();id=null;}}
  if(!plan)plan=await request('media/prepare',{name:file.name,size:file.size,mime:file.type,author,caption,contentHash},signal);const target=plan!;id=target.id;if(target.duplicate){onProgress(100);return {id,duplicate:true};}if(!target.uploadUrl)throw Error('Actualiza la página antes de volver a subir.');try{localStorage.setItem(storeKey,id!);}catch{}
  check();onStage?.('Subiendo el original…');let saved=false;
  for(let attempt=0;attempt<3;attempt++){check();if(attempt){onStage?.('Reintentando la conexión…');await new Promise(resolve=>setTimeout(resolve,attempt*1200));check();}try{await put(target.uploadUrl,file,onProgress,signal);saved=true;break;}catch{check();try{await request('media/complete',{id},signal);saved=true;break;}catch{check();}}}
  if(!saved)throw Error('La conexión no ha permitido terminar. Puedes reintentar este archivo.');
  if(target.thumbnailUploadUrl){onStage?.('Preparando la vista previa…');const {memoryThumbnail}=await import('./thumbnail');const thumbnail=await memoryThumbnail(file,signal);check();if(thumbnail)try{await put(target.thumbnailUploadUrl,thumbnail,()=>{},signal);}catch{check();}}
  check();await request('media/complete',{id},signal);try{localStorage.removeItem(storeKey);}catch{}onProgress(100);return {id,duplicate:false};
 }catch(error){if(signal?.aborted){if(id)try{await request('media/cancel',{id});}catch{}try{localStorage.removeItem(storeKey);}catch{}throw aborted();}throw error;}
}
