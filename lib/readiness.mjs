export function plannedAlbumBytes({guests,photos,photoMB,videos,videoMB}){
 const values=[guests,photos,photoMB,videos,videoMB].map(Number);if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('Revisa las cantidades del cálculo.');
 const [g,p,pm,v,vm]=values;return Math.ceil(g*(p*pm+v*vm)*1000000);
}
/** Leave space for a JSON manifest in each ZIP; originals are never recompressed. */
export function planOriginalBatches(files,maxBytes=99*1024*1024,maxFiles=29){
 const batches=[];let batch=[],size=0;
 for(const f of files){const bytes=Number(f.size);if(!Number.isSafeInteger(bytes)||bytes<1)throw Error('Hay un original sin tamaño válido.');if(bytes>maxBytes){if(batch.length)batches.push(batch);batches.push([f]);batch=[];size=0;continue;}if(batch.length&&(batch.length>=maxFiles||size+bytes>maxBytes)){batches.push(batch);batch=[];size=0;}batch.push(f);size+=bytes;}
 if(batch.length)batches.push(batch);return batches;
}
export function formatBytes(bytes){if(!Number.isFinite(Number(bytes)))return '—';const n=Math.max(0,Number(bytes));return n>=1e9?(n/1e9).toLocaleString('es-ES',{maximumFractionDigits:2})+' GB':n>=1e6?(n/1e6).toLocaleString('es-ES',{maximumFractionDigits:1})+' MB':Math.ceil(n/1000)+' KB';}
