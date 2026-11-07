import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseInvitationInput,invitationPass,isAlbumLink} from '../lib/invitation-access.mjs';
import {previewResponse} from '../lib/preview.mjs';
import {qrCard} from '../lib/qr-card.mjs';
const token='Aa_'.padEnd(32,'b');
test('El acceso acepta el enlace de WhatsApp y conserva las mayúsculas del pase real',()=>{assert.equal(parseInvitationInput('  https://boda.example/#i='+token+'  '),token);assert.equal(parseInvitationInput('/#i='+token+'&view=gallery'),token);assert.equal(parseInvitationInput(token),token);});
test('Un enlace al álbum o a la web general no se confunde con una invitación personal',()=>{for(const input of ['https://boda.example/#gallery','https://boda.example/','javascript:alert(1)','Ana García',''])assert.throws(()=>parseInvitationInput(input));});
test('El código de prueba admite minúsculas sin transformar un pase real',()=>{assert.equal(parseInvitationInput('jose-c926-818d-f422'),'JOSE-C926-818D-F422');});
test('El pase solo devuelve la credencial de una invitación validada y no incluye respuestas ni datos privados',()=>{const person={invitation:{id:'id',label:'Ana',guests:['Ana'],response:{allergies:'private'}},admin:true};const pass=invitationPass(person,token);assert.deepEqual(pass,{token,label:'Ana',guests:['Ana'],preview:false});assert.equal(invitationPass({invitation:null},token),null);assert.equal(invitationPass({...person,preview:true},token),null);assert.equal(invitationPass(person,'invalid'),null);});
test('El pase de prueba conserva su separación de las invitaciones reales',async()=>{const response=previewResponse(new Request('https://boda.example/api/invitation-pass',{headers:{cookie:'w_preview=JOSE-C926-818D-F422'}}),'invitation-pass','GET');const pass=await response.json();assert.equal(pass.preview,true);assert.equal(pass.label,'Jose');assert.equal(response.headers.get('cache-control'),'no-store');});
test('Las tarjetas personales y del álbum explican el acceso correcto',()=>{const png='data:image/png;base64,YQ==';const personal=qrCard(png,'Invitación de Ana','Andrea + Alberto','invitation');assert.ok(personal.includes('Escanea para abrir tu invitación personal'));assert.ok(!personal.includes('subir, ver y descargar'));assert.equal(isAlbumLink('https://boda.example/#gallery'),true);assert.equal(isAlbumLink('https://boda.example/#preview=abc&view=gallery'),true);assert.equal(isAlbumLink('https://boda.example/#i='+token),false);});

import {invitationMessage} from '../lib/invitations.mjs';
test('El mensaje para una familia evita instrucciones de introducir códigos y usa el plural',()=>{const text=invitationMessage('Ana y Luis','https://boda.example/#i='+token,'Andrea + Alberto','2027-09-16',2);assert.match(text,/vuestra invitación/);assert.match(text,/No necesitáis/);assert.match(text,/con vosotros/);assert.match(text,/Toca este enlace/);});
