"""A tiny real upload check. The image is never completed/published; it is cancelled.
Run explicitly: python scripts/check-album-transport.py --run
"""
import argparse,base64,hashlib,http.cookiejar,json,urllib.error,urllib.parse,urllib.request
parser=argparse.ArgumentParser();parser.add_argument('--run',action='store_true');args=parser.parse_args()
if not args.run:parser.error('Use --run to authorise one temporary non-public upload.')
origin='https://web-boda-albertoyandrea.vercel.app'
opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
image=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jv1sAAAAASUVORK5CYII=')
upload_id=None;out={}
def call(path,body=None):
 request=urllib.request.Request(origin+'/api/'+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'} if body is not None else {},method='POST' if body is not None else 'GET')
 try:
  with opener.open(request,timeout=25) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
try:
 _,before=call('media');out['public_before']=len(before.get('items',[]))
 code,plan=call('media/prepare',{'name':'verificacion-tecnica-sin-publicar.png','size':len(image),'mime':'image/png','author':'Prueba técnica sin publicar','contentHash':hashlib.sha256(image).hexdigest()});out['prepare']=code
 if code!=200:raise RuntimeError('No se pudo reservar la prueba.')
 if plan.get('duplicate'):raise RuntimeError('La imagen ya estaba compartida: no se modifica.')
 upload_id=plan['id'];code,initial=call('media/resume',{'id':upload_id});out['resume_before']=code
 if code!=200:raise RuntimeError('No se pudo recuperar la reserva inicial.')
 location=urllib.parse.urlsplit(initial['uploadUrl'])
 if location.scheme!='https' or location.hostname not in ['rxnzbrgkqmujpyvlvsum.supabase.co','rxnzbrgkqmujpyvlvsum.storage.supabase.co']:raise RuntimeError('Destino de almacenamiento inesperado.')
 request=urllib.request.Request(initial['uploadUrl'],data=image,headers={'Content-Type':'image/png'},method='PUT')
 try:
  with urllib.request.urlopen(request,timeout=25) as response:out['direct_upload']=response.status
 except urllib.error.HTTPError as error:raise RuntimeError('Subida de prueba fallida: '+str(error.code)) from None
 code,resume=call('media/resume',{'id':upload_id});out['resume_after']=code;out['original_detected']=resume.get('stored') is True;out['same_reservation']=resume.get('id')==upload_id
 if code!=200 or not out['original_detected'] or not out['same_reservation']:raise RuntimeError('No se pudo recuperar el original recibido.')
finally:
 if upload_id:
  code,_=call('media/cancel',{'id':upload_id});out['cleanup']=code
 _,after=call('media');out['public_after']=len(after.get('items',[]));print(json.dumps(out))
 if upload_id and out.get('cleanup')!=200:raise RuntimeError('Revisar limpieza de la reserva de prueba.')
