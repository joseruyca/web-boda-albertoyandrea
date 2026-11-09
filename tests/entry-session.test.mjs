import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseEntry,createEntryLoader,isRejectedInvitation} from '../lib/entry-session.mjs';
test('El QR público y el panel sin clave no intentan crear una sesión',()=>{
 assert.deepEqual(parseEntry('#gallery'),{view:'gallery',session:null,personal:false});
 assert.deepEqual(parseEntry('#admin'),{view:'admin',session:null,personal:false});
 assert.equal(parseEntry('#table').view,'rsvp');
});
test('Una lectura fallida después de autenticar no vuelve a intercambiar el enlace personal',async()=>{
 let exchanges=0,reads=0;const authenticated=[];
 const loader=createEntryLoader({entry:parseEntry('#i=test-token'),exchange:async()=>{exchanges++;},onAuthenticated:v=>authenticated.push(v),refresh:async()=>{if(++reads===1)throw new Error('Network unavailable');return {label:'Test invitation'};}});
 await assert.rejects(loader.load(),/Network/);assert.equal(loader.needsSession,false);
 assert.deepEqual(await loader.load(),{label:'Test invitation'});
 assert.equal(exchanges,1);assert.equal(reads,2);assert.deepEqual(authenticated,['invitation']);
});
test('Un fallo al abrir la sesión permite reintentarlo con el mismo token',async()=>{
 let exchanges=0,reads=0;const loader=createEntryLoader({entry:parseEntry('#preview=test'),exchange:async()=>{if(++exchanges===1)throw new Error('Offline');},refresh:async()=>{reads++;return true;}});
 await assert.rejects(loader.load(),/Offline/);assert.equal(loader.needsSession,true);assert.equal(reads,0);
 assert.equal(await loader.load(),true);assert.equal(exchanges,2);
});
test('Dos pulsaciones de reintento simultáneas comparten una sola apertura',async()=>{
 let release;let exchanges=0,reads=0;
 const loader=createEntryLoader({entry:parseEntry('#i=test'),exchange:()=>{exchanges++;return new Promise(resolve=>{release=resolve;});},refresh:async()=>{reads++;}});
 const first=loader.load(),second=loader.load();assert.equal(first,second);release();await Promise.all([first,second]);assert.equal(exchanges,1);assert.equal(reads,1);
});
test('Un corte de red o un error del servicio no se presenta como invitación inválida',()=>{
 assert.equal(isRejectedInvitation(new Error('Offline')),false);
 for(const status of [408,429,500,502,503])assert.equal(isRejectedInvitation({status}),false);
 for(const status of [400,401,403,404,410])assert.equal(isRejectedInvitation({status}),true);
});
