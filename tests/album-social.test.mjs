import {test} from 'node:test';
import assert from 'node:assert/strict';
import {automaticAlbumChoice,ALBUM_MOMENTS,validMoment,momentLabel,albumQuery,challengeOpen,groupedMemoryName} from '../lib/album-social.mjs';
import {makeMemoryZip} from '../lib/zip.mjs';
import {albumApi,resolveAlbumMember} from '../supabase/functions/wedding-api/album.ts';
test('Los momentos y filtros se codifican sin mezclar identificadores ni cargar solo la primera página',()=>{assert.equal(ALBUM_MOMENTS.length,7);assert.equal(validMoment('party'),true);assert.equal(validMoment('all'),false);assert.equal(momentLabel('unknown'),'Otros recuerdos');const q=new URL(albumQuery({scope:'mine',moment:'dinner',member:'a&scope=admin',offset:60}),'https://boda.test');assert.equal(q.searchParams.get('scope'),'mine');assert.equal(q.searchParams.get('member'),'a&scope=admin');assert.equal(q.searchParams.get('offset'),'60');});
test('Un reto cerrado o con plazo vencido nunca se muestra como abierto',()=>{assert.equal(challengeOpen({is_open:false}),false);assert.equal(challengeOpen({is_open:true,closes_at:'2000-01-01'}),false);assert.equal(challengeOpen({is_open:true,closes_at:null}),true);});
test('Las carpetas del ZIP conservan originales y neutralizan rutas del nombre del invitado',async()=>{const path=groupedMemoryName({name:'a.jpg',author:'../Ana/Pérez',moment:'party'});assert.equal(path.split('/').length,2);const zip=await makeMemoryZip([{name:'a.jpg',zipPath:'Ana Pérez/a.jpg',size:3}],async()=>new Uint8Array([1,2,3]).buffer);const bytes=new Uint8Array(await zip.arrayBuffer()),view=new DataView(bytes.buffer),length=view.getUint16(26,true);assert.equal(new TextDecoder().decode(bytes.slice(30,30+length)),'Ana Pérez/01-a.jpg');assert.deepEqual([...bytes.slice(30+length,33+length)],[1,2,3]);assert.equal(groupedMemoryName({name:'video.mov',moment:'party'},'moment'),'Fiesta/video.mov');});
test('Los nombres de archivo corrientes no pueden crear carpetas, pero zipPath sí puede',async()=>{const zip=await makeMemoryZip([{name:'../x.jpg',size:1}],async()=>new Uint8Array([1]).buffer);const bytes=new Uint8Array(await zip.arrayBuffer()),v=new DataView(bytes.buffer);assert.equal(new TextDecoder().decode(bytes.slice(30,30+v.getUint16(26,true))),'01-.._x.jpg');});
test('El perfil seleccionado siempre se consulta dentro del propietario autenticado',async()=>{const calls=[];const db={from:()=>({select(){return this;},eq(k,v){calls.push([k,v]);return this;},async maybeSingle(){return {data:null,error:null};}})};assert.equal(await resolveAlbumMember(db,'not-a-uuid','owner'),null);assert.equal(calls.length,0);assert.equal(await resolveAlbumMember(db,'a0a0a0a0-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner'),null);assert.deepEqual(calls,[['id','a0a0a0a0-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],['owner_key','owner']]);});
test('El QR no puede votar premios ni consultar el inventario privado',async()=>{const base={db:{},uploadOwner:'album:browser',memberId:'',organizer:false,inv:null,limit:async()=>true};for(const [path,method,body,status]of [['album/vote','PUT',{},401],['album/feed','GET',{scope:'admin'},403],['admin/album/challenges','GET',{},403],['album/media/a','PATCH',{},401]]){const r=await albumApi({...base,path,method,body});assert.equal(r.status,status,path);}});
test('Mis recuerdos exige un perfil sin devolver por accidente el álbum de otro invitado',async()=>{const r=await albumApi({db:{},path:'album/feed',method:'GET',body:{scope:'mine'},memberId:'',uploadOwner:'album:x',organizer:false,inv:null});assert.deepEqual(await r.json(),{items:[],hasMore:false,needsIdentity:true});});

test('La invitación individual abre su álbum sola, conserva el perfil y actualiza un nombre corregido',()=>{
 const choices=[{slot:'guest:0',name:'Jose'}];
 assert.deepEqual(automaticAlbumChoice({choices,current:null}),{slot:'guest:0'});
 assert.equal(automaticAlbumChoice({choices,current:{id:'a',slot:'guest:0',name:'Jose',verified:true}}),null);
 assert.deepEqual(automaticAlbumChoice({choices,current:{id:'a',slot:'guest:0',name:'Antiguo',verified:true}}),{slot:'guest:0'});
 assert.deepEqual(automaticAlbumChoice({choices,current:{id:'old',name:'Jose',verified:false}}),{slot:'guest:0'});
});
test('Una invitación compartida no atribuye las fotos a la primera persona por defecto',()=>{
 const choices=[{slot:'guest:0',name:'Ana'},{slot:'guest:1',name:'Luis'}];
 assert.equal(automaticAlbumChoice({choices,current:null}),null);
 assert.equal(automaticAlbumChoice({choices,current:{id:'b',slot:'guest:1',name:'Luis',verified:true}}),null);
 assert.equal(automaticAlbumChoice({choices,current:{id:'legacy',name:'Familia',verified:false}}),null);
 assert.deepEqual(automaticAlbumChoice({choices:[],members:[{id:'visitor'}]}),{memberId:'visitor'});
});
test('Los corazones de la galería no escriben reacciones: solo se vota en los retos',async()=>{
 const r=await albumApi({db:{},path:'album/like',method:'PUT',body:{liked:true},memberId:'',uploadOwner:'album:test',organizer:false,inv:null});
 assert.equal(r.status,405);
 assert.match((await r.json()).error,/solo en los retos/);
});
test('Las candidaturas disponibles exigen identidad y no devuelven la galería general',async()=>{
 const r=await albumApi({db:{},path:'album/feed',method:'GET',body:{scope:'eligible'},memberId:'',uploadOwner:'album:test',organizer:false,inv:null});
 assert.deepEqual(await r.json(),{items:[],hasMore:false,needsIdentity:true});
});
