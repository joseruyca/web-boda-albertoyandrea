import {ArrowUpRight} from 'lucide-react';
import type {WeddingConfig} from './config';
import VenuePhoto from './venue-photo';
import InkArt from './ink-art';
export default function Venue({config,onConfirm}:{config:WeddingConfig;onConfirm:()=>void}){
 const dinner=config.dinner,pre=config.prewedding;
 const samePlace=!dinner.venue||(dinner.venue.trim().toLocaleLowerCase('es')===config.venue.trim().toLocaleLowerCase('es')&&(!dinner.address||dinner.address===config.address));
 const places=[{label:samePlace?'LA BODA':'LA CEREMONIA',name:config.venue,address:config.address,map:config.mapUrl,menu:samePlace?dinner.menu:''},...(!samePlace?[{label:'LA CENA',name:dinner.venue,address:dinner.address,map:dinner.mapUrl,menu:dinner.menu}]:[]),...(pre.venue?[{label:'LA PREBODA',name:pre.venue,address:pre.address,map:pre.mapUrl,menu:''}]:[])];
 return <section className="content-scene hb-places"><header className="hb-places-title"><h1>Dos lugares.<br/><em>Un recuerdo.</em></h1><InkArt kind="vine" eager/></header><div className="hb-place-chapters">{places.map((place,i)=><article key={i} className={'hb-place hb-place-'+i}><span className="hb-place-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div className="hb-place-copy"><span className="eyebrow">{place.label}</span><h2>{place.name}</h2><p>{place.address}</p>{place.map&&<a className="solid-btn" href={place.map} target="_blank" rel="noreferrer" aria-label={'Cómo llegar a '+place.name}>Cómo llegar<ArrowUpRight size={16}/></a>}{place.menu&&<details className="dinner-menu"><summary>El menú</summary><p>{place.menu}</p></details>}</div><VenuePhoto name={place.name}/>{i===0&&<InkArt kind="vine" className="hb-place-vine"/>}</article>)}</div><footer className="hb-page-close"><button className="underline-link" onClick={onConfirm}>Mis alergias e intolerancias<ArrowUpRight size={15}/></button></footer></section>;
}
