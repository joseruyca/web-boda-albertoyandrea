import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestJSON} from '../lib/http.mjs';
const originalFetch=globalThis.fetch;
test('Una respuesta no JSON muestra una explicación legible',async()=>{globalThis.fetch=async()=>new Response('<html>Gateway error</html>',{status:502});try{await assert.rejects(requestJSON('/api/media'),/No se pudo leer/);}finally{globalThis.fetch=originalFetch;}});
test('Una conexión bloqueada termina sin reintentar operaciones',async()=>{let calls=0;globalThis.fetch=async(_url,{signal})=>{calls++;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));};try{await assert.rejects(requestJSON('/api/rsvp',{method:'POST'},5),/tardando demasiado/);assert.equal(calls,1);}finally{globalThis.fetch=originalFetch;}});
test('Cancelar una consulta conserva AbortError para no mostrar un fallo al cambiar de pantalla',async()=>{const controller=new AbortController();globalThis.fetch=async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));try{const task=requestJSON('/api/media',{signal:controller.signal});controller.abort();await assert.rejects(task,e=>e.name==='AbortError');}finally{globalThis.fetch=originalFetch;}});
