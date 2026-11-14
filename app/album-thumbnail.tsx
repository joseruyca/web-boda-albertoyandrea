'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,Loader2} from 'lucide-react';
export default function AlbumThumbnail({src,alt}:{src:string;alt:string}){
 const [status,setStatus]=useState('loading');const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{const node=image.current;setStatus(node?.complete?(node.naturalWidth?'ready':'failed'):'loading');},[src]);
 return <span className={'album-thumbnail thumbnail-'+status}>
  {status!=='ready'&&<span className="thumbnail-status" aria-hidden="true">{status==='loading'?<Loader2 className="spin" size={19}/>:<><Camera size={25}/><small>Abrir original</small></>}</span>}
  <img ref={image} src={src} alt={alt} loading="lazy" decoding="async" onLoad={()=>setStatus('ready')} onError={()=>setStatus('failed')}/>
 </span>;
}
