'use client';
type Plan={id:string;bucket:string;path:string;token:string;endpoint:string};
async function request(path:string,body:unknown){const r=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw Object.assign(Error(value.error||'No se pudo completar la subida.'),{status:r.status});return value;}
export async function uploadMemory(file:File,author:string,onProgress:(percent:number)=>void,caption=''){
 const storeKey='wedding-upload:v2:'+encodeURIComponent(file.name)+':'+file.size+':'+file.lastModified;
 let id:string|null=null;try{id=localStorage.getItem(storeKey);}catch{}
 let plan:Plan|undefined;
 if(id){
  try{await request('media/complete',{id});try{localStorage.removeItem(storeKey);}catch{}onProgress(100);return;}catch(e){if((e as {status?:number}).status===403|| (e as {status?:number}).status===404)id=null;}
  if(id)try{plan=await request('media/resume',{id});}catch{id=null;}
 }
 if(!plan)plan=await request('media/prepare',{name:file.name,size:file.size,mime:file.type,author,caption});
 const target=plan!;try{localStorage.setItem(storeKey,target.id);}catch{}
 const {Upload}=await import('tus-js-client');
 await new Promise<void>((resolve,reject)=>{
  const transfer=new Upload(file,{
   endpoint:target.endpoint,headers:{'x-signature':target.token},chunkSize:6*1024*1024,
   retryDelays:[0,1500,3000,5000,10000,20000],uploadDataDuringCreation:true,
   removeFingerprintOnSuccess:true,fingerprint:async()=> 'andrea-alberto:'+target.id,
   metadata:{bucketName:target.bucket,objectName:target.path,contentType:file.type,cacheControl:'3600'},
   onProgress:(sent,total)=>onProgress(Math.min(99,Math.round(sent/total*100))),
   onError:()=>reject(Error('La conexión se ha interrumpido. Vuelve a elegir este archivo para continuar la subida.')),
   onSuccess:()=>resolve(),
  });
  transfer.findPreviousUploads().then(previous=>{if(previous[0])transfer.resumeFromPreviousUpload(previous[0]);transfer.start();}).catch(reject);
 });
 await request('media/complete',{id:target.id});try{localStorage.removeItem(storeKey);}catch{}onProgress(100);
}
