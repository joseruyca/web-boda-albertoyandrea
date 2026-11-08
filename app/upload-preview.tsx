'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,FileImage,Film} from 'lucide-react';
import {createPreviewScheduler,mediaFileInfo} from '../lib/media-files.mjs';
const scheduler=createPreviewScheduler(2);
export default function UploadPreview({file}:{file:File}){
 const box=useRef<HTMLDivElement>(null);const [src,setSrc]=useState(''),[unavailable,setUnavailable]=useState(false);const info=mediaFileInfo(file);
 useEffect(()=>{const controller=new AbortController();let object='';let started=false;let observer:IntersectionObserver|undefined;const start=()=>{if(started||!info.valid)return;started=true;observer?.disconnect();scheduler.run(async()=>{if(controller.signal.aborted)return null;const {memoryThumbnail}=await import('../lib/thumbnail');return memoryThumbnail(file,controller.signal);},controller.signal).then(blob=>{if(controller.signal.aborted)return;if(blob){object=URL.createObjectURL(blob);setSrc(object);}else setUnavailable(true);});};if('IntersectionObserver' in window&&box.current){observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))start();},{rootMargin:'160px'});observer.observe(box.current);}else start();return()=>{controller.abort();observer?.disconnect();if(object)URL.revokeObjectURL(object);};},[file]);
 return <div ref={box} className="queue-preview" aria-label={'Vista previa de '+file.name}>{src?<img src={src} alt="" decoding="async"/>:info.kind==='video'?<Film size={23}/>:info.valid?<Camera size={23}/>:<FileImage size={23}/>}{info.kind==='video'&&src&&<span className="queue-video-label">Vídeo</span>}{unavailable&&<span className="queue-no-preview">Sin vista previa</span>}</div>;
}
