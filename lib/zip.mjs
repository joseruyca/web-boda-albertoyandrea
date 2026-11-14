// ZIP STORE (original bytes, no re-encoding). Browser bundle loaded only on demand.
const table=Uint32Array.from({length:256},(_,i)=>{for(let n=0;n<8;n++)i=i&1?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
export function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function header(size){const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)};}
export async function makeMemoryZip(files,load,onProgress=(_done,_total)=>{}){
 if(!files.length||files.length>30)throw Error('Selecciona entre 1 y 30 recuerdos.');
 const max=100*1024*1024;if(files.reduce((n,f)=>n+Number(f.size||0),0)>max)throw Error('Descarga hasta 100 MB por tanda. Selecciona menos archivos.');
 const parts=[],central=[];let offset=0,total=0;
 for(let i=0;i<files.length;i++){
  const f=files[i];const data=new Uint8Array(await load(f));total+=data.length;if(total>max)throw Error('Esta tanda supera los 100 MB. Selecciona menos archivos.');
  const segments=(f.zipPath?String(f.zipPath).split('/'):[String(f.name||'recuerdo').replace(/[\\/]/g,'_')]).filter(Boolean).slice(-3).map(s=>s.replace(/[\\\x00-\x1f]/g,'_').replace(/^\.+$/,'_').slice(0,150));if(!segments.length)segments.push('recuerdo');segments[segments.length-1]=String(i+1).padStart(2,'0')+'-'+segments[segments.length-1];const name=new TextEncoder().encode(segments.join('/'));
  const crc=crc32(data);const local=header(30);local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);local.view.setUint16(12,33,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,data.length,true);local.view.setUint32(22,data.length,true);local.view.setUint16(26,name.length,true);
  const entry=header(46);entry.view.setUint32(0,0x02014b50,true);entry.view.setUint16(4,20,true);entry.view.setUint16(6,20,true);entry.view.setUint16(8,0x800,true);entry.view.setUint16(14,33,true);entry.view.setUint32(16,crc,true);entry.view.setUint32(20,data.length,true);entry.view.setUint32(24,data.length,true);entry.view.setUint16(28,name.length,true);entry.view.setUint32(42,offset,true);
  parts.push(local.bytes,name,data);central.push(entry.bytes,name);offset+=30+name.length+data.length;onProgress(i+1,files.length);
 }
 const end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,central.reduce((n,c)=>n+c.length,0),true);end.view.setUint32(16,offset,true);
 return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}
