import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeUploadJobs,uploadQueueSummary} from '../lib/upload-queue.mjs';
const job=(id,status='queued',extra={})=>({id,status,memberId:'ana',file:{name:id+'.jpg',size:100,lastModified:1,type:'image/jpeg'},progress:0,validationError:'',...extra});
test('Elegir otra vez el mismo archivo no duplica su cola ni cambia de álbum',()=>{
 const first=job('1');const again={...first,id:'new'};
 assert.equal(mergeUploadJobs([first],[again,again]).length,1);
 assert.equal(mergeUploadJobs([first],[{...again,memberId:'luis'}]).length,2);
 assert.equal(mergeUploadJobs([{...first,status:'cancelled'}],[again]).length,2);
});
test('El progreso se pondera por bytes y no cuenta cancelados ni formatos rechazados',()=>{
 const rows=[job('photo','done'),job('video','uploading',{file:{size:900},progress:50}),job('cancelled','cancelled',{file:{size:5000}}),job('bad','error',{file:{size:8000},validationError:'Formato no válido'})];
 const state=uploadQueueSummary(rows);assert.equal(state.percent,55);assert.equal(state.done,1);assert.equal(state.failed,1);assert.equal(state.retryable,0);assert.equal(state.complete,false);
});
test('La confirmación de éxito exige todos los archivos guardados u omitidos por duplicado',()=>{
 assert.equal(uploadQueueSummary([]).complete,false);
 assert.equal(uploadQueueSummary([job('1','done'),job('2','duplicate')]).complete,true);
 assert.equal(uploadQueueSummary([job('1','done'),job('2','error')]).complete,false);
 assert.equal(uploadQueueSummary([job('1','error'),job('2','error',{validationError:'Grande'})]).retryable,1);
});
