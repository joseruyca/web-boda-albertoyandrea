import {test} from 'node:test';import assert from 'node:assert/strict';
import {encryptToken,decryptToken,randomToken,digest,equal,adminSession} from '../lib/security.ts';
process.env.INVITATION_ENCRYPTION_KEY='01'.repeat(32);process.env.ADMIN_KEY='test-key-not-used-in-deployment';
test('Los enlaces se recuperan desde su copia cifrada sin guardar el token en claro',()=>{const value=randomToken();const a=encryptToken(value),b=encryptToken(value);assert.notEqual(a,b);assert.equal(decryptToken(a),value);assert.equal(decryptToken(b),value);assert.ok(!a.includes(value));assert.equal(digest(value).length,64);});
test('Un enlace cifrado manipulado es rechazado',()=>{const v=Buffer.from(encryptToken(randomToken()),'base64url');v[20]^=1;assert.throws(()=>decryptToken(v.toString('base64url')));});
test('La sesión de organización cambia al cambiar su clave',()=>{const a=adminSession();process.env.ADMIN_KEY='different-test-key';assert.notEqual(adminSession(),a);assert.equal(equal('abcd','abcd'),true);assert.equal(equal('abcd','abce'),false);assert.equal(equal('abc','abcdef'),false);});
