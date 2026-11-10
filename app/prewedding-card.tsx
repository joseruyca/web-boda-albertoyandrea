import {ArrowUpRight,GlassWater} from 'lucide-react';
import type {WeddingConfig} from './config';

export default function PreweddingCard({config}:{config:WeddingConfig}){
 const event=config.prewedding;
 if(!event?.venue)return null;
 const date=event.date?new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(event.date+'T12:00:00Z')):'Fecha por confirmar';
 const hours=event.startTime&&event.endTime?`${event.startTime}–${event.endTime} h`:event.startTime?`${event.startTime} h`:'Horario por confirmar';
 return <article className="prewedding-paper" aria-labelledby="prewedding-title"><GlassWater size={20} aria-hidden="true"/><span className="location-label">LA PREBODA</span><h2 id="prewedding-title">Un brindis <em>antes.</em></h2><p className="prewedding-venue">{event.venue}</p><p className="prewedding-date">{date} · {hours}</p>{event.address&&<p className="prewedding-address">{event.address}</p>}{event.mapUrl&&<a className="underline-link" href={event.mapUrl} target="_blank" rel="noreferrer" aria-label={'Cómo llegar a '+event.venue}>Cómo llegar<ArrowUpRight size={16}/></a>}</article>;
}
