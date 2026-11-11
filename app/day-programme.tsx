import {ArrowUpRight,CalendarDays} from 'lucide-react';
import type {WeddingConfig} from './config';
import NaturalAccent from './natural-accent';
import {PracticalDetails} from './journey';
import {weddingCalendar} from '../lib/calendar.mjs';
import {displayProgramme,programmeDate} from '../lib/programme.mjs';
import styles from './day-programme.module.css';

function saveDate(config:WeddingConfig){
 const url=URL.createObjectURL(new Blob([weddingCalendar(config)],{type:'text/calendar;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='andrea-alberto-boda.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export default function DayProgramme({config,onDirections}:{config:WeddingConfig;onDirections:()=>void}){
 const event=config.prewedding,date=programmeDate(config.date),preDate=programmeDate(event.date);
 const moments=displayProgramme(config.timeline);
 return <section className={'content-scene '+styles.scene}>
  <header className={styles.heading}><h1 className={styles.title}>El gran <em>día.</em></h1>
   <div className={styles.dateBand}>{date?<time dateTime={config.date} aria-label={date.full}><span className={styles.day}>{date.day}</span><span className={styles.dateWords}><span className={styles.weekday}>{date.weekday}</span><span className={styles.month}>{date.month}</span><span className={styles.year}>{date.year}</span></span></time>:<p>Fecha por confirmar</p>}<NaturalAccent kind="flowers" className={styles.flowers}/></div>
  </header>
  <section className={styles.programme} aria-labelledby="day-programme-title"><h2 id="day-programme-title" className={styles.sectionLabel}>LA CELEBRACIÓN</h2><ol className={styles.moments}>{moments.map((moment,i)=><li key={i}><span className={styles.number} aria-hidden="true">{moment.number}</span><div><h3>{moment.title}</h3>{moment.time&&<p className={styles.time}>{moment.time} h</p>}{i===0&&!config.scheduleConfirmed&&<p className={styles.provisional}>Hora orientativa, según el tiempo.</p>}{moment.detail&&<p className={styles.detail}>{moment.detail}</p>}</div></li>)}</ol></section>
  {event.venue&&<section className={styles.prewedding} aria-labelledby="prewedding-title"><div><h2 id="prewedding-title">La <em>preboda.</em></h2><p>{preDate?preDate.full:'Fecha pendiente'}</p></div>{event.startTime&&<p className={styles.preweddingTime}>{event.startTime}{event.endTime?' — '+event.endTime:''} h</p>}</section>}
  <div className={styles.actions}><button className={'outline-btn '+styles.action} disabled={!date} onClick={()=>saveDate(config)}><CalendarDays size={16}/> Guardar fecha</button><button className={'underline-link '+styles.action} onClick={onDirections}>Cómo llegar<ArrowUpRight size={16}/></button></div>
  <PracticalDetails config={config}/>
 </section>;
}
