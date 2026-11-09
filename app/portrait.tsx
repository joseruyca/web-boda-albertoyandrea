'use client';
import {useEffect,useState} from 'react';
import Monogram from './monogram';
const fallback='/assets/andrea-alberto-portrait.webp';
export default function Portrait({src,alt}:{src:string;alt:string}){
 const [source,setSource]=useState(src||fallback),[unavailable,setUnavailable]=useState(false);
 useEffect(()=>{setSource(src||fallback);setUnavailable(false);},[src]);
 return unavailable?<div className="portrait-unavailable" role="img" aria-label={alt}><Monogram/><span>Andrea & Alberto</span></div>:<img src={source} alt={alt} fetchPriority="high" width="621" height="878" onError={()=>{if(source!==fallback)setSource(fallback);else setUnavailable(true);}}/>;
}
