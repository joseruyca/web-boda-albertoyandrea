import {ArrowUpRight,CalendarDays} from 'lucide-react';
import type {WeddingConfig} from './config';
import {PracticalDetails} from './journey';
import {weddingCalendar} from '../lib/calendar.mjs';
import {displayProgramme,programmeDate} from '../lib/programme.mjs';

function saveDate(config:WeddingConfig){
 const url=URL.createObjectURL(new Blob([weddingCalendar(config)],{type:'text/calendar;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='andrea-alberto-boda.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export default function DayProgramme({config,onDirections}:{config:WeddingConfig;onDirections:()=>void}){
 const event=config.prewedding,date=programmeDate(config.date),preDate=programmeDate(event.date);
 const moments=displayProgramme(config.timeline);
 return <section className="content-scene atelier-day">
  <header className="atelier-day-heading"><h1>El gran <em>día.</em></h1>{date?<time dateTime={config.date} aria-label={date.full} className="atelier-date"><span>{date.weekday}, {date.day} de {date.month}</span><span>{date.year} · Cáceres</span></time>:<p>Fecha por confirmar</p>}</header>
  <div className="atelier-day-body"><img className="atelier-meadow" src="/assets/meadow-stem.webp" width="360" height="1056" alt="" aria-hidden="true" decoding="async"/>
   <ol className="atelier-timeline" aria-label="El programa de la boda">{moments.map((moment,i)=><li key={i}><h2>{moment.title}</h2>{moment.time&&<p className="atelier-event-time">{moment.time} h</p>}{i===0&&!config.scheduleConfirmed&&<p className="atelier-event-note">Hora orientativa</p>}{moment.detail&&<p className="atelier-event-detail">{moment.detail}</p>}</li>)}</ol>
   <aside className="atelier-day-aside">{event.venue&&<section className="atelier-prewedding" aria-labelledby="prewedding-title"><h2 id="prewedding-title">La preboda</h2><p className="atelier-prewedding-place">{event.venue}</p><p className="atelier-prewedding-meta">{event.startTime&&<>{event.startTime}{event.endTime?' — '+event.endTime:''} · </>}{preDate?preDate.full:'Fecha pendiente'}</p>{event.mapUrl&&<a className="atelier-direction" href={event.mapUrl} target="_blank" rel="noreferrer" aria-label={'Cómo llegar a '+event.venue}>Cómo llegar<ArrowUpRight size={16}/></a>}</section>}
    <div className="atelier-day-actions"><button className="atelier-save-date" disabled={!date} onClick={()=>saveDate(config)}><CalendarDays size={16}/>Guardar fecha</button><button className="atelier-direction atelier-wedding-direction" onClick={onDirections}>El lugar de la boda<ArrowUpRight size={16}/></button></div>
   </aside>
  </div><PracticalDetails config={config}/>
 </section>;
}
