import {ArrowUpRight} from 'lucide-react';
import type {WeddingConfig} from './config';
import {PracticalDetails} from './journey';
import InkArt from './ink-art';
import {weddingCalendar} from '../lib/calendar.mjs';
import {displayProgramme,programmeDate} from '../lib/programme.mjs';
function saveDate(config:WeddingConfig){const url=URL.createObjectURL(new Blob([weddingCalendar(config)],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='andrea-alberto-boda.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export default function DayProgramme({config,onDirections}:{config:WeddingConfig;onDirections:()=>void}){
 const event=config.prewedding,date=programmeDate(config.date),preDate=programmeDate(event.date),moments=displayProgramme(config.timeline);
 return <section className="hb-day content-scene"><div className="hb-day-score"><header className="hb-day-title"><h1>El día que<br/><em>soñamos<span>.</span></em></h1></header>{date&&<time className="hb-date-badge" dateTime={config.date} aria-label={date.full}><span>{date.weekday}</span><strong>{date.day}</strong><span>{date.month}</span><span>{date.year}</span></time>}<InkArt kind="meadow" className="hb-day-meadow" eager/>
 <svg className="hb-score-line" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M0 490 C110 425 130 385 200 360 S310 245 410 245 S520 155 610 155 S720 55 800 55"/></svg>
 <ol className="hb-moments" aria-label="El programa de la boda">{moments.map((moment,i)=><li key={i}><span className="hb-moment-dot" aria-hidden="true"/><h2>{moment.title}</h2>{moment.time&&<p className="hb-moment-time">{moment.time} h</p>}{i===0&&!config.scheduleConfirmed&&<p className="hb-moment-note">Hora orientativa</p>}{moment.detail&&<p>{moment.detail}</p>}</li>)}</ol></div>
 {event.venue&&<aside className="hb-prewedding"><h2>Antes del sí.</h2><div><h3>La preboda</h3><p>{event.startTime}{event.endTime?' — '+event.endTime:''} h</p><p className="hb-prewedding-date">{preDate?preDate.full:'Fecha por confirmar'}</p></div><button className="underline-link" onClick={onDirections}>Ver el lugar<ArrowUpRight size={16}/></button></aside>}
 <footer className="hb-page-close hb-programme-actions"><em>{config.names.replace('+','&')}</em><button className="solid-btn" onClick={()=>saveDate(config)} disabled={!date}>Guardar la fecha</button><button className="underline-link" onClick={onDirections}>Cómo llegar<ArrowUpRight size={16}/></button></footer><PracticalDetails config={config}/></section>;
}
