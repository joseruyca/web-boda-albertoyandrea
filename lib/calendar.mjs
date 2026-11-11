const escape=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function foldCalendarLine(value){
 const encoder=new TextEncoder(),lines=[];let current='',bytes=0;
 for(const character of value){const size=encoder.encode(character).length;if(bytes+size>75){lines.push(current);current=' ';bytes=1;}current+=character;bytes+=size;}
 lines.push(current);return lines.join('\r\n');
}
export function weddingCalendar(config){
 const date=config.date.replaceAll('-','');const next=new Date(config.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const end=next.toISOString().slice(0,10).replaceAll('-','');
 const description=['Consulta tu invitación para los horarios y detalles definitivos.',config.timeline?.[0]?.time?(config.scheduleConfirmed?'Ceremonia: ':'Hora orientativa de la ceremonia: ')+config.timeline[0].time+' h.':'',config.mapUrl?'Cómo llegar: '+config.mapUrl:''].filter(Boolean).join('\n');
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Andrea Alberto//Wedding//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:wedding-'+date+'@andrea-alberto','DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+date,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+escape('Boda de '+config.names),'LOCATION:'+escape([config.venue,config.address].filter(Boolean).join(' · ')),'DESCRIPTION:'+escape(description),'END:VEVENT','END:VCALENDAR',''].map(foldCalendarLine).join('\r\n');
}
