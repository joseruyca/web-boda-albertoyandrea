import {ArrowUpRight,CalendarDays} from 'lucide-react';
import type {WeddingConfig} from './config';
import NaturalAccent from './natural-accent';
import {PracticalDetails} from './journey';
import {weddingCalendar} from '../lib/calendar.mjs';

function saveDate(config:WeddingConfig){
 const url=URL.createObjectURL(new Blob([weddingCalendar(config)],{type:'text/calendar'}));
 const link=document.createElement('a');link.href=url;link.download='andrea-alberto-boda.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export default function DayProgramme({config,onDirections}:{config:WeddingConfig;onDirections:()=>void}){
 const event=config.prewedding;
 const date=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Madrid'}).format(new Date(config.date+'T12:00:00Z'));
 const preDate=event.date?new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',timeZone:'Europe/Madrid'}).format(new Date(event.date+'T12:00:00Z')):'Fecha por confirmar';
 return <section className="content-scene programme-scene"><header className="stationery-heading"><span className="eyebrow">PARA CELEBRAR JUNTOS</span><h1 className="display-title">El gran <em>día.</em></h1><NaturalAccent kind="oats" className="programme-botanical"/></header>
 {event.venue&&<section className="prelude-note" aria-labelledby="prelude-title"><span className="eyebrow">ANTES DEL SÍ</span><h2 id="prelude-title">La preboda.</h2><p className="prelude-date">{preDate}</p><p className="prelude-hours">{event.startTime||'Horario pendiente'}{event.endTime?' — '+event.endTime:''}{event.startTime?' h':''}</p></section>}
 <section className="programme-paper" aria-labelledby="programme-title"><div className="programme-date"><span className="eyebrow">LA CELEBRACIÓN</span><h2 id="programme-title">La boda.</h2><p>{date}</p></div><ol className="programme-list">{config.timeline.map((moment,i)=><li key={i}><div className={'programme-marker'+(moment.time?' has-time':'')}>{moment.time?moment.time.split('–').map((part,n)=><span key={n}>{n>0?'— ':''}{part}</span>):String(i+1).padStart(2,'0')}</div><div><h3>{moment.title}</h3>{moment.detail&&<p>{moment.detail}</p>}</div></li>)}</ol><button className="underline-link" onClick={()=>saveDate(config)}><CalendarDays size={16}/> Guardar la fecha</button></section>
 <button className="underline-link programme-directions" onClick={onDirections}>Ver las ubicaciones<ArrowUpRight size={17}/></button><PracticalDetails config={config}/></section>;
}
