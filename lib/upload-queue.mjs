/** Queue identity is local selection metadata; the server separately checks content hashes. */
export function mergeUploadJobs(current,incoming){
 const key=j=>JSON.stringify([j.memberId||'',j.file.name,j.file.size,j.file.lastModified,j.file.type]);
 const seen=new Set(current.filter(j=>j.status!=='cancelled').map(key));
 return [...current,...incoming.filter(job=>{const value=key(job);if(seen.has(value))return false;seen.add(value);return true;})];
}
export function uploadQueueSummary(jobs){
 const count=status=>jobs.filter(j=>j.status===status).length;
 const done=count('done'),duplicates=count('duplicate'),paused=count('paused'),waiting=count('queued'),active=count('uploading');
 const retryable=jobs.filter(j=>j.status==='error'&&!j.validationError).length;
 const failed=count('error');
 const live=jobs.filter(j=>j.status!=='cancelled'&&!j.validationError);
 const totalBytes=live.reduce((sum,j)=>sum+j.file.size,0);
 const sentBytes=live.reduce((sum,j)=>sum+j.file.size*(j.status==='done'||j.status==='duplicate'?1:Math.min(99,Math.max(0,j.progress))/100),0);
 return {done,duplicates,paused,waiting,active,failed,retryable,cancelled:count('cancelled'),total:jobs.length,percent:totalBytes?Math.floor(sentBytes/totalBytes*100):0,complete:jobs.length>0&&jobs.every(j=>j.status==='done'||j.status==='duplicate')};
}
