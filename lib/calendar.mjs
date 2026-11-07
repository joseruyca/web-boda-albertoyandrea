const escape=value=>String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function weddingCalendar(config){
 const date=config.date.replaceAll('-','');const next=new Date(config.date+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);const end=next.toISOString().slice(0,10).replaceAll('-','');
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Andrea Alberto//Wedding//ES','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:wedding-'+date+'@andrea-alberto','DTSTAMP:20261101T000000Z','DTSTART;VALUE=DATE:'+date,'DTEND;VALUE=DATE:'+end,'SUMMARY:'+escape('Boda de '+config.names),'LOCATION:'+escape(config.venue+' · '+config.address),'DESCRIPTION:'+escape('Consulta tu invitación para los horarios y detalles definitivos.'),'END:VEVENT','END:VCALENDAR',''].join('\r\n');
}
