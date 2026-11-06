/** Parse a small invitation CSV. Header: invitacion;personas;telefono. Guests separated by |. */
export function parseInvitationsCSV(source) {
 const lines=[];let row=[],cell='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===';'&&!quoted){row.push(cell.trim());cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&source[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))lines.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('Hay comillas sin cerrar en el CSV.');row.push(cell.trim());if(row.some(Boolean))lines.push(row);
 if(lines[0]?.[0]?.toLowerCase().replace(/^\ufeff/,'')==='invitacion')lines.shift();
 if(!lines.length)throw Error('Añade al menos una invitación.');if(lines.length>300)throw Error('Máximo 300 invitaciones por tanda.');
 return lines.map((r,i)=>{if(r.length>3)throw Error(`Revisa los separadores de la fila ${i+1}.`);const guests=(r[1]||'').split('|').map(s=>s.trim()).filter(Boolean);if(!r[0]||!guests.length||guests.length>15)throw Error(`Fila ${i+1}: añade un nombre de invitación y entre 1 y 15 personas.`);return {label:r[0].slice(0,120),guests:guests.map(s=>s.slice(0,80)),phone:(r[2]||'').replace(/[^0-9+]/g,'').slice(0,30)};});
}
export function invitationMessage(label,url,names,date){const when=new Date(date+'T12:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});return `¡Hola, ${label}! 💛\n\n¡Nos casamos el ${when}! Nos haría mucha ilusión celebrarlo contigo.\n\nEsta es vuestra invitación personal. Aquí podéis confirmar quién viene, consultar vuestra mesa cuando esté lista y compartir fotos y vídeos:\n${url}\n\n${names.replace(' + ',' y ')} 🥂`;}
