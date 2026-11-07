import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeMemories,toggleMemorySelection,MAX_SELECTION,albumEmptyMessage} from '../lib/album-state.mjs';
test('Las páginas solapadas del álbum conservan orden y no duplican recuerdos',()=>{const first=[{id:'a'},{id:'b'}];assert.deepEqual(mergeMemories(first,[{id:'b'},{id:'c'},{id:'c'},{id:'d'}]).map(x=>x.id),['a','b','c','d']);assert.equal(first.length,2);});
test('La selección limita el ZIP antes de descargar y permite desmarcar al llegar al límite',()=>{let selection=[];for(let i=0;i<MAX_SELECTION+4;i++)selection=toggleMemorySelection(selection,String(i));assert.equal(selection.length,MAX_SELECTION);assert.equal(selection.includes('30'),false);selection=toggleMemorySelection(selection,'0');assert.equal(selection.length,29);assert.ok(toggleMemorySelection(selection,'new').includes('new'));});
test('Un filtro vacío explica qué formato falta sin afirmar que no hay recuerdos',()=>{assert.match(albumEmptyMessage('video'),/vídeos/);assert.match(albumEmptyMessage('image'),/fotos/);assert.match(albumEmptyMessage('all'),/álbum/);});
