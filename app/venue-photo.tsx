'use client';
import {useState} from 'react';
import {ImageOff,RotateCcw} from 'lucide-react';
import InkArt from './ink-art';


const photographs={
 huerta:{src:'/assets/huerta-del-conde-supplied.jpg',width:960,height:640,alt:'La fachada, el jardín y la fuente de Casa Palacio Huerta del Conde, Cáceres'},
 corral:{src:'/assets/corral-ciguenas-supplied.jpg',width:1000,height:750,alt:'El patio de El Corral de las Cigüeñas, con las palmeras y las mesas junto al muro de hiedra'}
};
type Photograph=typeof photographs.huerta;
function PhotographImage({photo}:{photo:Photograph}){
 const [failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0);
 return failed?<div className="venue-photo-unavailable" role="status" style={{aspectRatio:`${photo.width}/${photo.height}`}}><ImageOff size={24} aria-hidden="true"/><p>No se ha podido cargar la foto.</p><button className="small-link" onClick={()=>{setAttempt(n=>n+1);setFailed(false);}}><RotateCcw size={15}/> Volver a cargar</button></div>:<img key={attempt} className="venue-photograph" src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} loading="lazy" decoding="async" onError={()=>setFailed(true)}/>;
}
export default function VenuePhoto({name}:{name:string}){
 const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const key=normalized.includes('huerta del conde')?'huerta':normalized.includes('corral')&&normalized.includes('ciguen')?'corral':null;
 if(!key)return null;
 const photo=photographs[key];
 return <figure className={'venue-photo venue-photo-'+key}><div className="venue-photo-mount"><PhotographImage key={photo.src} photo={photo}/></div><InkArt kind={key==='huerta'?'rose':'vine'} className="venue-photo-ornament"/></figure>;
}
