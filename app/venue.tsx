import {ArrowUpRight} from 'lucide-react';
import type {WeddingConfig} from './config';
import VenuePhoto from './venue-photo';

function Directions({url,name}:{url:string;name:string}){return url?<a className="underline-link" href={url} target="_blank" rel="noreferrer" aria-label={'Cómo llegar a '+name}>Cómo llegar<ArrowUpRight size={16}/></a>:null;}
export default function Venue({config,onConfirm}:{config:WeddingConfig;onConfirm:()=>void}){
 const dinner=config.dinner,pre=config.prewedding;
 const samePlace=!dinner.venue||(dinner.venue.trim().toLocaleLowerCase('es')===config.venue.trim().toLocaleLowerCase('es')&&(!dinner.address||dinner.address===config.address));
 return <section className="content-scene directions-scene"><header className="stationery-heading"><span className="eyebrow">CÁCERES</span><h1 className="display-title">Nos vemos <em>aquí.</em></h1></header><div className="directions-layout"><div className="directions-places"><article className="address-note" data-reveal><div className="address-copy"><span className="eyebrow">{samePlace?'CEREMONIA Y CELEBRACIÓN':'LA CEREMONIA'}</span><h2>{config.venue||'El lugar de la boda'}</h2>{config.address&&<p>{config.address}</p>}<Directions url={config.mapUrl} name={config.venue}/>{dinner.menu&&samePlace&&<details className="dinner-menu"><summary>El menú</summary><p>{dinner.menu}</p></details>}</div><VenuePhoto name={config.venue}/></article>
 {!samePlace&&<article className="address-note" data-reveal><div className="address-copy"><span className="eyebrow">LA CENA</span><h2>{dinner.venue}</h2><p>{dinner.address}</p><Directions url={dinner.mapUrl} name={dinner.venue}/>{dinner.menu&&<details className="dinner-menu"><summary>El menú</summary><p>{dinner.menu}</p></details>}</div><VenuePhoto name={dinner.venue}/></article>}
 {pre.venue&&<article className="address-note address-prewedding" data-reveal><div className="address-copy"><span className="eyebrow">LA PREBODA</span><h2>{pre.venue}</h2><p>{pre.address}</p><Directions url={pre.mapUrl} name={pre.venue}/></div><VenuePhoto name={pre.venue}/></article>}<button className="underline-link dietary-link" onClick={onConfirm}>Mis alergias e intolerancias<ArrowUpRight size={15}/></button></div></div></section>;
}
