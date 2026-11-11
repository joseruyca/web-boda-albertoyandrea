import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayProgramme,programmeDate} from '../lib/programme.mjs';
import {foldCalendarLine,weddingCalendar} from '../lib/calendar.mjs';

test('El programa elimina los avisos repetidos y conserva las indicaciones concretas',()=>{
 const entries=displayProgramme([{title:'Ceremonia',time:'18:30–19:00',detail:'Hora orientativa, según el tiempo. Confirmaremos la hora exacta.'},{title:'Cóctel',time:'',detail:'Cóctel · horario por confirmar'},{title:'Cena',time:'21:15',detail:'Menú y celebración en el jardín'}]);
 assert.equal(entries[0].time,'18:30 — 19:00');assert.equal(entries[0].detail,'');assert.equal(entries[1].detail,'Cóctel');assert.equal(entries[2].detail,'Menú y celebración en el jardín');assert.deepEqual(entries.map(e=>e.number),['01','02','03']);
});
test('Una fecha ausente o imposible no rompe el programa; el día de la boda es sábado',()=>{
 for(const date of ['',null,'no-es-fecha','2027-02-30','2027-13-18'])assert.equal(programmeDate(date),null);
 const date=programmeDate('2027-09-18');assert.equal(date.weekday,'sábado');assert.equal(date.day,'18');assert.equal(date.month,'septiembre');
});
test('El calendario divide líneas largas sin cortar acentos o perder enlaces',()=>{
 const original='SUMMARY:'+('Ángeles, José y celebración 🎉 ').repeat(20),folded=foldCalendarLine(original);
 assert.ok(folded.includes('\r\n '));assert.equal(folded.replace(/\r\n /g,''),original);for(const line of folded.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
 const map='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent('Huerta del Conde, Cáceres '.repeat(10));
 const calendar=weddingCalendar({date:'2027-09-18',names:'Andrea + Alberto',venue:'Huerta del Conde',address:'Cáceres',mapUrl:map});
 for(const line of calendar.split('\r\n'))assert.ok(new TextEncoder().encode(line).length<=75);
 assert.ok(calendar.replace(/\r\n /g,'').includes(map));assert.ok(calendar.includes('DTSTART;VALUE=DATE:20270918'));
});
