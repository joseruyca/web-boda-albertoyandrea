import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
export function digest(value:string){return createHash('sha256').update(value).digest('hex');}
export function equal(a:string,b:string){const x=Buffer.from(a);const y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export function adminSession(){if(!process.env.ADMIN_KEY)throw Error('Configuración de organización pendiente.');return createHmac('sha256',process.env.ADMIN_KEY).update('andrea-alberto:organizer:v1').digest('base64url');}
export function randomToken(){return randomBytes(24).toString('base64url');}
function encryptionKey(){const v=process.env.INVITATION_ENCRYPTION_KEY;if(!v||!/^[a-f0-9]{64}$/.test(v))throw Error('Configuración de invitaciones pendiente.');return Buffer.from(v,'hex');}
export function encryptToken(token:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');}
export function decryptToken(value:string){const b=Buffer.from(value,'base64url');const decipher=createDecipheriv('aes-256-gcm',encryptionKey(),b.subarray(0,12));decipher.setAuthTag(b.subarray(12,28));return Buffer.concat([decipher.update(b.subarray(28)),decipher.final()]).toString('utf8');}
