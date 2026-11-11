export function displayProgramme(timeline=[]){
 return timeline.map((moment,index)=>({
  number:String(index+1).padStart(2,'0'),
  title:String(moment.title||''),
  time:String(moment.time||'').trim().replace(/\s*[–—]\s*/g,' — '),
  detail:String(moment.detail||'').replace(/\s*[·—-]\s*horario por confirmar[.!]?$/iu,'').replace(/^Hora orientativa, según el tiempo\. Confirmaremos la hora exacta\.?$/u,'').trim()
 }));
}

export function programmeDate(value){
 const date=/^\d{4}-\d{2}-\d{2}$/.test(value||'')?new Date(value+'T12:00:00Z'):null;
 if(!date||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==value)return null;
 const format=options=>new Intl.DateTimeFormat('es-ES',{...options,timeZone:'Europe/Madrid'}).format(date);
 return {day:format({day:'numeric'}),month:format({month:'long'}),year:format({year:'numeric'}),weekday:format({weekday:'long'}),full:format({weekday:'long',day:'numeric',month:'long',year:'numeric'})};
}
