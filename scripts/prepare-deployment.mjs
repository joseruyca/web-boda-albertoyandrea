// Initial setup only. Reuses existing local secrets, never overwrites them.
import fs from 'node:fs';import {randomBytes,createHash} from 'node:crypto';
const path='.env.local';const values={};if(fs.existsSync(path))for(const line of fs.readFileSync(path,'utf8').split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)values[m[1]]=m[2];}
values.WEDDING_API_URL||='https://rxnzbrgkqmujpyvlvsum.supabase.co/functions/v1/wedding-api';
values.WEDDING_BACKEND_SECRET||=randomBytes(48).toString('base64url');values.ADMIN_KEY||=randomBytes(32).toString('base64url');values.INVITATION_ENCRYPTION_KEY||=randomBytes(32).toString('hex');
fs.writeFileSync(path,Object.entries(values).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});fs.chmodSync(path,0o600);
const hash=createHash('sha256').update(values.WEDDING_BACKEND_SECRET).digest('hex');const source='supabase/functions/wedding-api/index.ts';fs.writeFileSync(source,fs.readFileSync(source,'utf8').replace(/const BACKEND_HASH='[^']*';/,`const BACKEND_HASH='${hash}';`));
console.log('Initial server configuration prepared. Secret values were not printed.');
