'use client';
export async function memoryThumbnail(file:File,signal?:AbortSignal):Promise<Blob|null>{
 if(signal?.aborted)return null;
 const canvas=document.createElement('canvas');let width=0,height=0;let source:CanvasImageSource;let release=()=>{};
 try{
  if(file.type.startsWith('image/')){const bitmap=await createImageBitmap(file);width=bitmap.width;height=bitmap.height;source=bitmap;release=()=>bitmap.close();}
  else if(file.type.startsWith('video/')){const video=document.createElement('video');const object=URL.createObjectURL(file);release=()=>{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(object);};video.muted=true;video.playsInline=true;video.preload='auto';await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Sin miniatura de vídeo')),7000);video.onloadeddata=()=>{clearTimeout(timer);resolve();};video.onerror=()=>{clearTimeout(timer);reject(Error('Formato de vídeo no previsualizable'));};video.src=object;});width=video.videoWidth;height=video.videoHeight;source=video;}
  else return null;
  if(!width||!height||signal?.aborted)return null;const scale=Math.min(1,960/Math.max(width,height));canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));canvas.getContext('2d')?.drawImage(source,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.76));return blob&&blob.type==='image/webp'&&blob.size<=400000?blob:null;
 }catch{return null;}finally{release();canvas.width=0;canvas.height=0;}
}
