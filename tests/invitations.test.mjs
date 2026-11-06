import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseInvitationsCSV,invitationMessage} from '../lib/invitations.mjs';
test('Importa familias, nombres con acentos y números internacionales',()=>{assert.deepEqual(parseInvitationsCSV('\ufeffinvitacion;personas;telefono\r\nAna y Luis;Ana García|Luis Pérez;+34 612 345 678'),[{label:'Ana y Luis',guests:['Ana García','Luis Pérez'],phone:'+34612345678'}]);});
test('Respeta delimitadores y saltos dentro de comillas',()=>{assert.equal(parseInvitationsCSV('"Familia; García";"Ana|Luis";')[0].label,'Familia; García');assert.equal(parseInvitationsCSV('"Familia\nGarcía";Ana;')[0].label,'Familia\nGarcía');});
test('Rechaza filas ambiguas o sin invitados',()=>{assert.throws(()=>parseInvitationsCSV('Familia;;'));assert.throws(()=>parseInvitationsCSV('"Familia;Ana;'));assert.throws(()=>parseInvitationsCSV('Familia;Ana;tel;sobra'));});
test('El mensaje contiene el enlace personal y la fecha real',()=>{const s=invitationMessage('Familia García','https://boda.example/#i=abc','Andrea + Alberto','2027-09-16');assert.match(s,/16 de septiembre de 2027/);assert.match(s,/Andrea y Alberto/);assert.match(s,/#i=abc/);});
