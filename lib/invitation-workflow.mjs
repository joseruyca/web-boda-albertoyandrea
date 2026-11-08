const timestamp=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
export function invitationActivity(invitation){return Math.max(...['updated_at','created_at','sent_at','opened_at'].map(key=>timestamp(invitation[key])));}
export function deliveryStage(invitation){return invitation.response?'answered':invitation.sent_at||invitation.opened_at?'awaiting':'unsent';}
const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
export function selectInvitations(invitations,{filter='active',query='',sort='updated'}={}){
 const needle=normalized(query).trim();
 return invitations.filter(i=>{if(filter==='revoked')return !!i.revoked;if(filter==='all')return true;if(i.revoked)return false;return filter==='active'||filter==='pending'&&!i.response||['unsent','awaiting','answered'].includes(filter)&&deliveryStage(i)===filter||filter==='yes'&&i.response?.attending.some(Boolean)||filter==='no'&&i.response&&!i.response.attending.some(Boolean);}).filter(i=>!needle||normalized([i.label,...i.guests,i.phone||''].join(' ')).includes(needle)).sort((a,b)=>{const tie=String(a.label).localeCompare(String(b.label),'es',{sensitivity:'base'})||String(a.id).localeCompare(String(b.id));return sort==='name'?tie:sort==='oldest'?invitationActivity(a)-invitationActivity(b)||tie:sort==='created'?timestamp(b.created_at)-timestamp(a.created_at)||tie:invitationActivity(b)-invitationActivity(a)||tie;});
}
export function invitationReminder(label,url,names,date,deadline='',count=1){
 const when=new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
 const limit=deadline?' Si '+(count>1?'podéis':'puedes')+' responder antes del '+new Date(deadline+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long'})+', nos ayudará a organizarlo todo.':'';
 return `Hola, ${label}:\n\nEstamos preparando nuestra boda del ${when} y nos falta ${count>1?'vuestra':'tu'} respuesta.${limit}\n\n${count>1?'Podéis':'Puedes'} confirmar la asistencia desde ${count>1?'vuestro':'tu'} enlace personal, sin registrarse:\n${url}\n\n¡Gracias por ayudarnos con los preparativos!\n${names.replace(/\s*\+\s*/g,' y ')}`;
}
export function whatsappDraftUrl(phone,message){let number=String(phone||'').trim();if(number){if(!/^[+\d\s().-]+$/.test(number))throw Error('Revisa el teléfono e incluye el prefijo del país, por ejemplo +34.');number=number.replace(/[^\d]/g,'').replace(/^00/,'');if(!/^[1-9]\d{9,14}$/.test(number))throw Error('Incluye el prefijo del país, por ejemplo +34.');}return 'https://wa.me/'+number+'?text='+encodeURIComponent(message);}
